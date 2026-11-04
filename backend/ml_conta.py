"""Conectar a conta de estudo do Mercado Livre (OAuth). Só o admin conecta.

Fluxo: o admin abre /api/ml/conectar (com o token), recebe a URL do ML, autoriza
no navegador e o ML volta em /api/ml/callback, que guarda o token da conta de
estudo. A partir daí o estudo lê o ML por essa conta.
"""

import secrets

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from backend import ml
from backend.auth import exigir_admin
from backend.db import get_db
from backend.models import ContaML, Usuario

router = APIRouter(prefix="/api/ml", tags=["ml"])


@router.get("/conectar")
def conectar(_adm: Usuario = Depends(exigir_admin)):
    state = secrets.token_urlsafe(8)
    return {"url": ml.url_autorizacao(state), "state": state,
            "instrucao": "Abra a URL, autorize com a conta de estudo do Mercado Livre e volte."}


@router.get("/callback")
def callback(code: str = "", state: str = "", db: Session = Depends(get_db)):
    if not code:
        return HTMLResponse("<p>Faltou o código do Mercado Livre. Tente conectar de novo.</p>", status_code=400)
    try:
        with httpx.Client(timeout=20) as http:
            cred = ml.trocar_code_por_token(http, code, state)
    except ml.ErroML as e:
        return HTMLResponse(f"<p>Não consegui conectar: {e.mensagem}</p>", status_code=400)
    conta = db.query(ContaML).first() or ContaML()
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
    return HTMLResponse("<p>Conta de estudo do Mercado Livre conectada. Pode fechar esta aba.</p>")


@router.get("/situacao")
def situacao(_adm: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    conta = db.query(ContaML).first()
    conectado = bool(conta and (conta.credenciais or {}).get("access_token"))
    return {"conectado": conectado, "apelido": conta.apelido if conta else ""}
