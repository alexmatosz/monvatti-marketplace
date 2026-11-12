"""Vincular a conta do Mercado Livre (OAuth), uma por usuário, como no Avant.

Fluxo: o usuário logado chama /api/ml/conectar (com o token), recebe a URL do
ML, autoriza no navegador com a SUA conta e volta. Quem está conectando viaja
no `state` assinado (security.criar_state_ml / ler_state_ml), porque o retorno
do ML não traz o token da sessão. Dois modos de retorno:

- hospedado (HTTPS): o ML redireciona para /api/ml/callback, que guarda o token;
- local/dev: o ML redireciona para o callback do Postman, o usuário copia o
  código e o cola em /api/ml/colar (o Mercado Livre não aceita localhost).
"""

import re

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, ml, security
from backend.auth import exigir_admin, usuario_atual
from backend.db import get_db
from backend.models import ContaML, Usuario

router = APIRouter(prefix="/api/ml", tags=["ml"])


class Codigo(BaseModel):
    code: str = Field(min_length=1, max_length=500)
    state: str = Field(min_length=1, max_length=200)


def _guardar(db: Session, usuario_id: int, cred: dict) -> ContaML:
    conta = db.query(ContaML).filter(ContaML.usuario_id == usuario_id).first() or ContaML(usuario_id=usuario_id)
    conta.credenciais = cred
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


@router.get("/conectar")
def conectar(u: Usuario = Depends(exigir_admin)):
    state = security.criar_state_ml(u.id)
    try:
        url = ml.url_autorizacao(state)
    except ml.ErroML as e:
        raise HTTPException(503, e.mensagem)
    manual = "/api/ml/callback" not in config.ML_REDIRECT_URI
    return {"url": url, "state": state, "manual": manual,
            "instrucao": "Autorize com a sua conta do Mercado Livre e "
                         + ("copie o código que aparecer e cole aqui." if manual else "volte à extensão.")}


@router.get("/callback")
def callback(code: str = "", state: str = "", db: Session = Depends(get_db)):
    if not code:
        return HTMLResponse("<p>Faltou o código do Mercado Livre. Tente conectar de novo pela extensão.</p>", status_code=400)
    usuario_id = security.ler_state_ml(state)
    if not usuario_id:
        return HTMLResponse("<p>Link de conexão inválido ou expirado. Conecte de novo pela extensão.</p>", status_code=400)
    try:
        with httpx.Client(timeout=20) as http:
            cred = ml.trocar_code_por_token(http, code, state)
    except ml.ErroML as e:
        return HTMLResponse(f"<p>Não consegui conectar: {e.mensagem}</p>", status_code=400)
    _guardar(db, usuario_id, cred)
    return HTMLResponse("<p>Conta do Mercado Livre vinculada. Pode fechar esta aba e voltar à extensão.</p>")


@router.post("/colar")
def colar(dados: Codigo, u: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    if security.ler_state_ml(dados.state) != u.id:
        raise HTTPException(400, "Vínculo inválido. Clique em Vincular de novo e refaça.")
    code = dados.code.strip()
    achado = re.search(r"code=([^&\s]+)", code)
    if achado:
        code = achado.group(1)
    try:
        with httpx.Client(timeout=20) as http:
            cred = ml.trocar_code_por_token(http, code, dados.state)
    except ml.ErroML as e:
        raise HTTPException(400, e.mensagem)
    conta = _guardar(db, u.id, cred)
    return {"conectado": True, "apelido": conta.apelido}


@router.get("/situacao")
def situacao(u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    conta = db.query(ContaML).filter(ContaML.usuario_id == u.id).first()
    conectado = bool(conta and (conta.credenciais or {}).get("access_token"))
    return {"conectado": conectado, "apelido": conta.apelido if conta else ""}


@router.post("/desconectar")
def desconectar(u: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    conta = db.query(ContaML).filter(ContaML.usuario_id == u.id).first()
    if conta:
        db.delete(conta)
        db.commit()
    return {"conectado": False}
