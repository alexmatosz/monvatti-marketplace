"""App do backend do Monvatti Marketplace (login + estudo)."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend import auth, cadastro, config, estudo, ml_conta, pagamento
from backend.db import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Monvatti Marketplace", version=config.VERSAO_EXTENSAO,
              description="Backend da extensão Monvatti Marketplace: login e estudo de anúncios do Mercado Livre.")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

log = logging.getLogger("monvatti")


# Sem isto, um erro inesperado volta como 500 sem os cabeçalhos de CORS e o Chrome
# mostra só "não consegui falar com o servidor". Assim a extensão recebe o motivo.
@app.exception_handler(Exception)
async def erro_inesperado(request: Request, exc: Exception):
    log.exception("Erro em %s %s", request.method, request.url.path)
    return JSONResponse(
        {"detail": f"Erro no servidor Monvatti ({type(exc).__name__}: {str(exc)[:160]}). Tente de novo em instantes."},
        status_code=500,
        headers={"Access-Control-Allow-Origin": "*"},
    )


app.include_router(auth.router)
app.include_router(cadastro.router)
app.include_router(estudo.router)
app.include_router(ml_conta.router)
app.include_router(pagamento.router)


@app.get("/api/ping")
def ping():
    return {"ok": True, "modo_demonstracao": config.MODO_DEMONSTACAO}
