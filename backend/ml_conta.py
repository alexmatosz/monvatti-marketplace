"""Vincular contas do Mercado Livre (OAuth, só leitura).

Cada cliente autoriza o app do ML com a PRÓPRIA conta, e o estudo dele lê a API
com esse token (como era no Replique). Assim ninguém divide conta: 100 clientes
são 100 autorizações. A conta de estudo CENTRAL (vinculada pelo admin) fica de
reserva para quem ainda não conectou.

Três portas de entrada para o mesmo fluxo OAuth:
- landing (logo após o cadastro/pagamento): /convite/conectar e /convite/colar,
  autenticadas pelo convite assinado que o cadastro devolve;
- popup da extensão (cliente logado): /conectar, /colar, /desconectar;
- conta central (só admin): /central/conectar, /central/colar, /central/desconectar.

Quem está conectando (e se é a central) viaja no `state` assinado, porque o
retorno do ML não traz a sessão. Dois modos de retorno:
- hospedado (HTTPS): o ML redireciona para /api/ml/callback, que guarda o token;
- local/dev: o ML redireciona para o callback do Postman, a pessoa copia o
  código e o cola (o Mercado Livre não aceita localhost).
"""

import re
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, ml, security
from backend.auth import exigir_admin, usuario_atual
from backend.db import get_db
from backend.models import ContaML, Usuario, agora

router = APIRouter(prefix="/api/ml", tags=["ml"])


class Codigo(BaseModel):
    code: str = Field(min_length=1, max_length=500)
    state: str = Field(min_length=1, max_length=200)


class Convite(BaseModel):
    convite: str = Field(min_length=10, max_length=400)


class CodigoConvite(Codigo):
    convite: str = Field(min_length=10, max_length=400)


def _manual() -> bool:
    return "/api/ml/callback" not in config.ML_REDIRECT_URI


def _conta_do_usuario(db: Session, usuario_id: int) -> ContaML | None:
    return db.query(ContaML).filter(ContaML.usuario_id == usuario_id).first()


def _guardar(db: Session, cred: dict, usuario_id: int | None) -> ContaML:
    """usuario_id=None grava a conta central."""
    conta = (_conta_do_usuario(db, usuario_id) if usuario_id else ml.conta_central(db)) or ContaML(usuario_id=usuario_id)
    conta.credenciais = cred
    conta.atualizado_em = agora()
    if conta.id is None:
        db.add(conta)
    db.commit()
    try:
        r = ml.MercadoLivre(dict(cred))._get("/users/me")
        if r.status_code < 400:
            conta.apelido = r.json().get("nickname", "")
            conta.credenciais = {**cred, "user_id": str(r.json().get("id") or "")}
            db.commit()
    except Exception:
        pass
    return conta


def _iniciar(usuario_id: int, central: bool) -> dict:
    state = security.criar_state_ml(usuario_id, central=central)
    try:
        url = ml.url_autorizacao(state)
    except ml.ErroML as e:
        raise HTTPException(503, e.mensagem)
    return {"url": url, "state": state, "manual": _manual()}


def _trocar(code: str, state: str) -> dict:
    code = code.strip()
    achado = re.search(r"code=([^&\s]+)", code)
    if achado:
        code = achado.group(1)
    try:
        with httpx.Client(timeout=20) as http:
            return ml.trocar_code_por_token(http, code, state)
    except ml.ErroML as e:
        raise HTTPException(400, e.mensagem)


def _situacao_conta(conta: ContaML | None) -> dict:
    conectado = bool(conta and (conta.credenciais or {}).get("access_token"))
    return {"conectado": conectado, "apelido": conta.apelido if conectado else ""}


def _usuario_do_convite(db: Session, convite: str) -> Usuario:
    uid = security.ler_convite(convite)
    u = db.get(Usuario, uid) if uid else None
    if not u or not u.ativo:
        raise HTTPException(400, "Link de conexão inválido ou vencido. Entre em contato com o suporte da Monvatti.")
    return u


# ---------------------------------------------------------------- landing (convite)

@router.get("/modo")
def modo():
    """A landing pergunta se o retorno do ML é automático ou se precisa colar o código."""
    return {"manual": _manual()}


@router.post("/convite/conectar")
def convite_conectar(dados: Convite, db: Session = Depends(get_db)):
    u = _usuario_do_convite(db, dados.convite)
    return {**_iniciar(u.id, central=False), "nome": u.nome.split(" ")[0]}


@router.post("/convite/colar")
def convite_colar(dados: CodigoConvite, db: Session = Depends(get_db)):
    u = _usuario_do_convite(db, dados.convite)
    if security.ler_state_ml(dados.state) != (u.id, False):
        raise HTTPException(400, "Conexão inválida. Clique em Conectar de novo e refaça.")
    return _situacao_conta(_guardar(db, _trocar(dados.code, dados.state), u.id))


@router.post("/convite/situacao")
def convite_situacao(dados: Convite, db: Session = Depends(get_db)):
    u = _usuario_do_convite(db, dados.convite)
    return _situacao_conta(_conta_do_usuario(db, u.id))


# ---------------------------------------------------------------- retorno do ML

class Retorno(BaseModel):
    code: str = Field(min_length=1, max_length=500)
    state: str = Field(min_length=1, max_length=200)


def _concluir(db: Session, code: str, state: str) -> tuple[ContaML, bool]:
    """Troca o código pelo token e grava na conta certa. Quem é o dono (e se é a
    central) vem do state assinado, então não precisa de login: serve tanto ao
    retorno do ML (callback) quanto à extensão que captura o código."""
    lido = security.ler_state_ml(state)
    usuario = db.get(Usuario, lido[0]) if lido else None
    central = bool(lido and lido[1])
    if not usuario or (central and usuario.papel != "admin"):
        raise HTTPException(400, "Link de conexão inválido ou expirado. Conecte de novo.")
    if not code.strip():
        raise HTTPException(400, "Faltou o código do Mercado Livre. Conecte de novo.")
    return _guardar(db, _trocar(code, state), None if central else usuario.id), central


@router.get("/callback")
def callback(code: str = "", state: str = "", db: Session = Depends(get_db)):
    try:
        conta, central = _concluir(db, code, state)
    except HTTPException as e:
        return HTMLResponse(f"<p>{e.detail}</p>", status_code=400)
    if central:
        return HTMLResponse("<p>Conta de estudo central vinculada. Pode fechar esta aba.</p>")
    return RedirectResponse(f"{config.LANDING_URL}/conectado?conta={quote(conta.apelido or '')}", status_code=303)


@router.post("/retorno")
def retorno(dados: Retorno, db: Session = Depends(get_db)):
    """Modo local: a extensão lê code+state da página de retorno (callback do
    Postman) e manda para cá — ninguém precisa copiar e colar."""
    conta, central = _concluir(db, dados.code, dados.state)
    return {**_situacao_conta(conta), "central": central}


# ---------------------------------------------------------------- popup (a própria conta)

@router.get("/conectar")
def conectar(u: Usuario = Depends(usuario_atual)):
    return _iniciar(u.id, central=False)


@router.post("/colar")
def colar(dados: Codigo, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    if security.ler_state_ml(dados.state) != (u.id, False):
        raise HTTPException(400, "Conexão inválida. Clique em Conectar de novo e refaça.")
    return _situacao_conta(_guardar(db, _trocar(dados.code, dados.state), u.id))


@router.get("/situacao")
def situacao(u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    propria = _situacao_conta(_conta_do_usuario(db, u.id))
    central = _situacao_conta(ml.conta_central(db))
    if u.papel != "admin":
        central["apelido"] = ""
    return {**propria, "propria": propria, "central": central,
            "estudo_liberado": propria["conectado"] or central["conectado"]}


@router.post("/desconectar")
def desconectar(u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    conta = _conta_do_usuario(db, u.id)
    if conta:
        db.delete(conta)
        db.commit()
    return {"conectado": False}


# ---------------------------------------------------------------- conta central (admin)

@router.get("/central/conectar")
def central_conectar(u: Usuario = Depends(exigir_admin)):
    return _iniciar(u.id, central=True)


@router.post("/central/colar")
def central_colar(dados: Codigo, u: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    if security.ler_state_ml(dados.state) != (u.id, True):
        raise HTTPException(400, "Conexão inválida. Clique em Vincular de novo e refaça.")
    return _situacao_conta(_guardar(db, _trocar(dados.code, dados.state), None))


@router.post("/central/desconectar")
def central_desconectar(_adm: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    conta = ml.conta_central(db)
    if conta:
        db.delete(conta)
        db.commit()
    return {"conectado": False}
