"""Vincular a conta do Mercado Livre (OAuth), uma por usuário, como no Avant.

Fluxo: o usuário logado chama /api/ml/conectar (com o token), recebe a URL do
ML, autoriza no navegador com a SUA conta e o ML volta em /api/ml/callback, que
guarda o token para esse usuário. A partir daí o estudo lê o ML pela conta dele.
O callback do ML não traz o token da sessão, então quem está conectando viaja
no `state` assinado (security.criar_state_ml / ler_state_ml).
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from backend import ml, security
from backend.auth import usuario_atual
from backend.db import get_db
from backend.models import ContaML, Usuario

router = APIRouter(prefix="/api/ml", tags=["ml"])


@router.get("/conectar")
def conectar(u: Usuario = Depends(usuario_atual)):
    state = security.criar_state_ml(u.id)
    try:
        url = ml.url_autorizacao(state)
    except ml.ErroML as e:
        raise HTTPException(503, e.mensagem)
    return {"url": url, "state": state,
            "instrucao": "Abra a URL, autorize com a sua conta do Mercado Livre e volte."}


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
    conta = db.query(ContaML).filter(ContaML.usuario_id == usuario_id).first() or ContaML(usuario_id=usuario_id)
    conta.credenciais = cred
    if conta.id is None:
        db.add(conta)
    db.commit()
    try:
        cliente = ml.MercadoLivre(dict(cred))
        r = cliente._get("/users/me")
        if r.status_code < 400:
            conta.apelido = r.json().get("nickname", "")
            conta.credenciais = {**cred, "user_id": str(r.json().get("id") or "")}
            db.commit()
    except Exception:
        pass
    return HTMLResponse("<p>Conta do Mercado Livre vinculada. Pode fechar esta aba e voltar à extensão.</p>")


@router.get("/situacao")
def situacao(u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    conta = db.query(ContaML).filter(ContaML.usuario_id == u.id).first()
    conectado = bool(conta and (conta.credenciais or {}).get("access_token"))
    return {"conectado": conectado, "apelido": conta.apelido if conta else ""}


@router.post("/desconectar")
def desconectar(u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    conta = db.query(ContaML).filter(ContaML.usuario_id == u.id).first()
    if conta:
        db.delete(conta)
        db.commit()
    return {"conectado": False}
