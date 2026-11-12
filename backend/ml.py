"""Cliente enxuto do Mercado Livre para o estudo (só leitura + OAuth).

Portado do adaptador do Replique, com só o que a extensão precisa: conectar a
conta de estudo (OAuth, uma por servidor) e ler tarifas, frete, vendedor, itens
e perguntas. As chamadas ao ML só podem ser testadas com uma conta real.
"""

from __future__ import annotations

import time
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from backend import config
from backend.models import ContaML, agora
from backend.security import pkce_do_state

API = "https://api.mercadolibre.com"
AUTH_URL = "https://auth.mercadolivre.com.br/authorization"


class ErroML(Exception):
    def __init__(self, mensagem: str):
        super().__init__(mensagem)
        self.mensagem = mensagem


def url_autorizacao(state: str) -> str:
    if not config.ML_CLIENT_ID:
        raise ErroML("ML_CLIENT_ID não configurado no ambiente do servidor.")
    _, desafio = pkce_do_state(state)
    params = {"response_type": "code", "client_id": config.ML_CLIENT_ID,
              "redirect_uri": config.ML_REDIRECT_URI, "state": state,
              "code_challenge": desafio, "code_challenge_method": "S256"}
    return f"{AUTH_URL}?{urlencode(params)}"


def trocar_code_por_token(http: httpx.Client, code: str, state: str = "") -> dict:
    dados = {"grant_type": "authorization_code", "client_id": config.ML_CLIENT_ID,
             "client_secret": config.ML_CLIENT_SECRET, "code": code.strip(),
             "redirect_uri": config.ML_REDIRECT_URI}
    if state:
        dados["code_verifier"] = pkce_do_state(state)[0]
    r = http.post(f"{API}/oauth/token", data=dados)
    if r.status_code >= 400:
        raise ErroML(f"O Mercado Livre recusou o código de autorização: {r.text[:300]}")
    d = r.json()
    d["obtido_em"] = time.time()
    return d


class MercadoLivre:
    def __init__(self, cred: dict, salvar=None):
        self.cred = cred or {}
        self._salvar = salvar or (lambda _c: None)
        self.http = httpx.Client(timeout=20)

    def _token(self) -> str | None:
        if not self.cred.get("access_token"):
            return None
        expira = self.cred.get("obtido_em", 0) + self.cred.get("expires_in", 21600) - 120
        if time.time() > expira:
            if not self.cred.get("refresh_token"):
                raise ErroML("A conexão com o Mercado Livre expirou. Reconecte a conta de estudo.")
            r = self.http.post(f"{API}/oauth/token", data={
                "grant_type": "refresh_token", "client_id": config.ML_CLIENT_ID,
                "client_secret": config.ML_CLIENT_SECRET, "refresh_token": self.cred["refresh_token"]})
            if r.status_code >= 400:
                raise ErroML("A conexão com o Mercado Livre expirou. Reconecte a conta de estudo.")
            novo = r.json()
            novo["obtido_em"] = time.time()
            self.cred.update(novo)
            self._salvar(self.cred)
        return self.cred["access_token"]

    def _get(self, caminho: str, params: dict | None = None, auth: bool = True):
        headers = {}
        if auth and (tok := self._token()):
            headers["Authorization"] = f"Bearer {tok}"
        return self.http.get(f"{API}{caminho}", params=params, headers=headers)

    def _user_id(self) -> str:
        if not self.cred.get("user_id"):
            r = self._get("/users/me")
            if r.status_code < 400:
                self.cred["user_id"] = str(r.json().get("id") or "")
        return self.cred.get("user_id", "")

    def _req(self, metodo: str, caminho: str, contexto: str, **kw):
        tok = self._token()
        headers = {"Authorization": f"Bearer {tok}"} if tok else {}
        r = self.http.request(metodo, f"{API}{caminho}", headers=headers, **kw)
        if r.status_code >= 400:
            raise ErroML(f"Mercado Livre — {contexto}: HTTP {r.status_code}")
        return r.json()

    def tarifa_venda(self, preco: float, listing_type_id: str, category_id: str = "") -> dict | None:
        params = {"price": round(preco, 2), "listing_type_id": listing_type_id or "gold_special"}
        if category_id:
            params["category_id"] = category_id
        r = self._get(f"/sites/{config.ML_SITE_ID}/listing_prices", params)
        if r.status_code >= 400:
            return None
        d = r.json()
        d = d[0] if isinstance(d, list) and d else d
        return d if isinstance(d, dict) and "sale_fee_amount" in d else None

    def tarifas_de_venda(self, preco: float, category_id: str = "") -> dict:
        params = {"price": round(preco, 2)}
        if category_id:
            params["category_id"] = category_id
        r = None
        for _ in range(3):
            try:
                r = self._get(f"/sites/{config.ML_SITE_ID}/listing_prices", params)
            except httpx.HTTPError:
                r = None
            if r is not None and r.status_code != 429:
                break
            time.sleep(1)
        if r is None or r.status_code >= 400 or not isinstance(r.json(), list):
            return {}
        return {d["listing_type_id"]: d for d in r.json() if isinstance(d, dict) and d.get("listing_type_id")}

    def medidas_da_categoria(self, category_id: str) -> str | None:
        r = self._get(f"/categories/{category_id}/shipping_preferences")
        d = (r.json().get("dimensions") or {}) if r.status_code < 400 else {}
        if not all(d.get(k) for k in ("height", "width", "length", "weight")):
            return None
        return f"{round(d['height'])}x{round(d['width'])}x{round(d['length'])},{round(d['weight'])}"

    def custo_frete_gratis(self, preco: float, dimensoes: str, listing_type_id: str, condicao: str = "new") -> float | None:
        try:
            d = self._req("GET", f"/users/{self._user_id()}/shipping_options/free", "calcular frete", params={
                "dimensions": dimensoes, "item_price": round(preco, 2), "listing_type_id": listing_type_id or "gold_special",
                "mode": "me2", "condition": condicao, "logistic_type": "drop_off", "verbose": "true"})
        except ErroML:
            return None
        custo = ((d.get("coverage") or {}).get("all_country") or {}).get("list_cost")
        return float(custo) if custo is not None else None

    def frete_do_anuncio(self, vendedor_id: str, item_id: str, preco: float | None = None) -> dict | None:
        params = {"item_id": item_id}
        if preco:
            params["item_price"] = round(preco, 2)
        r = self._get(f"/users/{vendedor_id}/shipping_options/free", params)
        if r.status_code >= 400:
            return None
        cobertura = (r.json().get("coverage") or {}).get("all_country") or {}
        if cobertura.get("list_cost") is None:
            return None
        return {"custo": float(cobertura["list_cost"]), "peso_g": cobertura.get("billable_weight")}

    def primeira_pergunta(self, item_id: str) -> dict:
        r = self._get("/questions/search", {"item": item_id, "sort_fields": "date_created", "sort_types": "ASC",
                                            "limit": 1, "api_version": 4})
        if r.status_code >= 400:
            return {}
        d = r.json()
        perguntas = d.get("questions") or []
        return {"total": d.get("total"), "primeira": perguntas[0].get("date_created") if perguntas else None,
                "vendedor_id": str(perguntas[0].get("seller_id") or "") if perguntas else ""}


def _conectada(conta) -> bool:
    return bool(conta and (conta.credenciais or {}).get("access_token"))


def conta_ml_do_usuario(db: Session, usuario):
    """A conta do ML que o estudo deste usuário usa: a dele, se vinculou; senão a
    conta CENTRAL da Monvatti (a que um administrador vinculou). Assim o cliente
    entra só com o e-mail e já estuda; o vínculo próprio fica como opção futura."""
    from backend.models import Usuario
    propria = db.query(ContaML).filter(ContaML.usuario_id == usuario.id).first()
    if _conectada(propria):
        return propria
    admins = [u.id for u in db.query(Usuario).filter(Usuario.papel == "admin", Usuario.ativo.is_(True)).order_by(Usuario.id)]
    for conta in db.query(ContaML).filter(ContaML.usuario_id.in_(admins or [-1])).order_by(ContaML.atualizado_em.desc()):
        if _conectada(conta):
            return conta
    return None


def cliente_ml(db: Session, usuario) -> MercadoLivre:
    """Cliente da API do ML pela conta que vale para este usuário (própria ou central)."""
    conta = conta_ml_do_usuario(db, usuario)
    if not conta:
        raise ErroML("A conta de estudo do Mercado Livre não está conectada. Fale com o suporte da Monvatti.")

    def salvar(cred: dict):
        conta.credenciais = dict(cred)
        conta.atualizado_em = agora()
        db.commit()

    return MercadoLivre(dict(conta.credenciais), salvar)
