"""App do backend do Monvatti Marketplace (login + estudo)."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import auth, config, estudo
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

app.include_router(auth.router)
app.include_router(estudo.router)


@app.get("/api/ping")
def ping():
    return {"ok": True, "modo_demonstracao": config.MODO_DEMONSTACAO}
