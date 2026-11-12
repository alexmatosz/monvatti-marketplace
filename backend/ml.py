"""Cliente enxuto do Mercado Livre para o estudo (só leitura + OAuth).

Cliente da API do ML com só o que a extensão precisa: conectar a
conta de cada cliente (OAuth, autorizada na landing ou no popup) e ler
tarifas, frete, vendedor, itens e perguntas. Quem ainda não conectou usa a
conta de estudo central (reserva, vinculada pelo admin). As chamadas ao ML só
podem ser testadas com uma conta real.
"""

from __future__ import annotations

import re
import threading
import time
from collections import OrderedDict
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from backend import config
from backend.db import SessionLocal
from backend.models import ContaML, agora
from backend.security import pkce_do_state

API = "https://api.mercadolibre.com"
AUTH_URL = "https://auth.mercadolivre.com.br/authorization"

INDISPONIVEL = "O estudo do Mercado Livre está indisponível no momento. Fale com o suporte da Monvatti."
CONECTE = ("Conecte a sua conta do Mercado Livre para liberar o estudo: clique no ícone da Monvatti "
           "e em “Conectar minha conta do Mercado Livre”.")

# O refresh_token do ML só vale UMA vez. Se dois pedidos do mesmo cliente (ou
# dois clientes na conta central) renovarem ao mesmo tempo, o segundo derruba a
# conexão; a trava garante uma renovação por vez (vale para um processo: rode
# com 1 worker).
_TRAVA_RENOVACAO = threading.Lock()


# ---------------------------------------------------------------- cache
# Taxas, vendedor, frete e catálogo mudam pouco e são iguais para todos os
# clientes (são dados públicos de anúncios de terceiros). Guardar a resposta no
# servidor corta a maior parte das chamadas ao ML: uma busca de 50 anúncios
# que custava ~500 chamadas cai para quase nada quando alguém já estudou os
# mesmos anúncios no dia. Só respostas 200 entram; /users/me e visitas nunca.
_REGRAS_CACHE = [
    (re.compile(r"^/sites/MLB/listing_prices$"), 24 * 3600),          # tabela de taxas
    (re.compile(r"^/users/\d+$"), 24 * 3600),                         # vendedor (reputação, medalha, cidade)
    (re.compile(r"^/users/\d+/shipping_options/free$"), 24 * 3600),   # frete grátis do anúncio
    (re.compile(r"^/products/MLB\d+$"), 7 * 24 * 3600),               # data do catálogo
    (re.compile(r"^/products/MLB\d+/items$"), 6 * 3600),              # vendedores no catálogo
    (re.compile(r"^/items/MLB\d+$"), 6 * 3600),                       # anúncio (data de criação, tipo)
    (re.compile(r"^/questions/search$"), 6 * 3600),                   # 1ª pergunta e total
    (re.compile(r"^/categories/"), 7 * 24 * 3600),                    # categoria e medidas
    (re.compile(r"^/sites/MLB/domain_discovery/search$"), 24 * 3600),
    (re.compile(r"^/highlights/"), 6 * 3600),                         # mais vendidos da categoria
    (re.compile(r"^/sites/MLB/search$"), 3600),
]
_CACHE_MAX = 50_000
_cache: OrderedDict[str, tuple[float, int, object]] = OrderedDict()
_trava_cache = threading.Lock()
cache_estatistica = {"acertos": 0, "chamadas": 0}


def _validade(caminho: str) -> int:
    return next((s for regra, s in _REGRAS_CACHE if regra.search(caminho)), 0)


def _chave(caminho: str, params: dict | None) -> str:
    return caminho + "?" + urlencode(sorted((params or {}).items()))


class _RespostaGuardada:
    """Imita o pedaço do httpx.Response que o estudo usa."""

    def __init__(self, status_code: int, dados):
        self.status_code = status_code
        self._dados = dados

    def json(self):
        return self._dados


def limpar_cache() -> None:
    with _trava_cache:
        _cache.clear()


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
    def __init__(self, cred: dict, salvar=None, recarregar=None):
        self.cred = cred or {}
        self._salvar = salvar or (lambda _c: None)
        self._recarregar = recarregar or (lambda: None)
        self.http = httpx.Client(timeout=20)

    def _expirado(self) -> bool:
        return time.time() > self.cred.get("obtido_em", 0) + self.cred.get("expires_in", 21600) - 120

    def _token(self) -> str | None:
        if not self.cred.get("access_token"):
            return None
        if self._expirado():
            with _TRAVA_RENOVACAO:
                # outro pedido pode ter renovado enquanto este esperava a trava
                atual = self._recarregar()
                if atual and atual.get("access_token"):
                    self.cred = dict(atual)
                if self._expirado():
                    self._renovar()
        return self.cred["access_token"]

    def _renovar(self):
        if not self.cred.get("refresh_token"):
            raise ErroML(INDISPONIVEL)
        r = self.http.post(f"{API}/oauth/token", data={
            "grant_type": "refresh_token", "client_id": config.ML_CLIENT_ID,
            "client_secret": config.ML_CLIENT_SECRET, "refresh_token": self.cred["refresh_token"]})
        if r.status_code >= 400:
            raise ErroML(INDISPONIVEL)
        novo = r.json()
        novo["obtido_em"] = time.time()
        self.cred.update(novo)
        self._salvar(self.cred)

    def _get(self, caminho: str, params: dict | None = None, auth: bool = True):
        validade = _validade(caminho)
        chave = _chave(caminho, params) if validade else ""
        if validade:
            with _trava_cache:
                guardado = _cache.get(chave)
                if guardado and guardado[0] > time.time():
                    _cache.move_to_end(chave)
                    cache_estatistica["acertos"] += 1
                    return _RespostaGuardada(guardado[1], guardado[2])
        headers = {}
        if auth and (tok := self._token()):
            headers["Authorization"] = f"Bearer {tok}"
        r = self.http.get(f"{API}{caminho}", params=params, headers=headers)
        cache_estatistica["chamadas"] += 1
        if validade and r.status_code == 200:
            try:
                dados = r.json()
            except ValueError:
                return r
            with _trava_cache:
                _cache[chave] = (time.time() + validade, 200, dados)
                _cache.move_to_end(chave)
                while len(_cache) > _CACHE_MAX:
                    _cache.popitem(last=False)
        return r

    def _user_id(self) -> str:
        if not self.cred.get("user_id"):
            r = self._get("/users/me")
            if r.status_code < 400:
                self.cred["user_id"] = str(r.json().get("id") or "")
        return self.cred.get("user_id", "")

    def _req(self, metodo: str, caminho: str, contexto: str, **kw):
        if metodo == "GET":
            r = self._get(caminho, kw.get("params"))
            if r.status_code >= 400:
                raise ErroML(f"Mercado Livre — {contexto}: HTTP {r.status_code}")
            return r.json()
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


def conta_central(db: Session) -> ContaML | None:
    """A conta de estudo do servidor (a linha sem usuario_id)."""
    return db.query(ContaML).filter(ContaML.usuario_id.is_(None)).order_by(ContaML.id).first()


def _conectada(conta: ContaML | None) -> bool:
    return bool(conta and (conta.credenciais or {}).get("access_token"))


def cliente_ml(db: Session, usuario=None) -> MercadoLivre:
    """A conta do ML que este cliente autorizou; se ele ainda não conectou, a
    conta de estudo central (reserva). Levanta ErroML se não houver nenhuma."""
    conta = db.query(ContaML).filter(ContaML.usuario_id == usuario.id).first() if usuario else None
    if not _conectada(conta):
        conta = conta_central(db)
    if not _conectada(conta):
        raise ErroML(CONECTE if usuario else INDISPONIVEL)
    conta_id = conta.id

    def salvar(cred: dict):
        conta.credenciais = dict(cred)
        conta.atualizado_em = agora()
        db.commit()

    def recarregar() -> dict | None:
        with SessionLocal() as s:
            c = s.get(ContaML, conta_id)
            return dict(c.credenciais or {}) if c else None

    return MercadoLivre(dict(conta.credenciais), salvar, recarregar)
