"""Endpoints usados pela extensão.

O que já funciona de verdade:
- /versao  — a versão que o servidor espera da extensão;
- /eu      — quem está logado, imposto padrão e conta do ML detectada;
- /estudo  — gera a planilha .xlsx a partir dos itens que a própria extensão já
             coletou na página (não depende de chamar o Mercado Livre).

O que depende da conta de estudo do Mercado Livre (passo do dev):
- /anuncio, /tarifas, /busca — leem dados do anúncio no ML. O código original do
  Replique está em backend/_referencia_estudo_replique.py; o dev porta as chamadas
  usando a conta de estudo e um adaptador do ML. Enquanto não entra, respondem com
  uma mensagem clara em vez de dado falso.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, estudo_planilha
from backend.auth import usuario_atual
from backend.db import get_db
from backend.models import Usuario

router = APIRouter(prefix="/api/extensao", tags=["extensao"])

_SEM_ML = "Conecte a conta de estudo do Mercado Livre no servidor para ver os dados do anúncio."


class Pagina(BaseModel):
    conta_ml: str = Field(default="", max_length=30)
    pagina: dict


class Tarifas(BaseModel):
    conta_ml: str = Field(default="", max_length=30)
    preco: float
    categoria_id: str = Field(default="", max_length=40)
    tipo: str = Field(default="", max_length=20)
    vendedor_id: str = Field(default="", max_length=40)
    item_id: str = Field(default="", max_length=40)


class Busca(BaseModel):
    conta_ml: str = Field(default="", max_length=30)
    itens: list[dict] = Field(min_length=1, max_length=estudo_planilha.MAX_ANUNCIOS)
    lote: int = 0


class Estudo(BaseModel):
    pesquisa: str = Field(default="", max_length=300)
    filtro: str = Field(default="", max_length=120)
    imposto: float = 0.0
    itens: list[dict] = Field(min_length=1, max_length=estudo_planilha.MAX_ANUNCIOS)


@router.get("/versao")
def versao():
    return {"versao": config.VERSAO_EXTENSAO}


@router.get("/eu")
def eu(conta_ml: str = "", u: Usuario = Depends(usuario_atual)):
    return {"ligado": True, "nome": u.nome, "imposto": u.imposto_padrao,
            "conta": {"conta": conta_ml or "deslogado"}, "clientes": []}


@router.post("/anuncio")
def anuncio(_dados: Pagina, _u: Usuario = Depends(usuario_atual)):
    raise HTTPException(503, _SEM_ML)


@router.post("/tarifas")
def tarifas(_dados: Tarifas, _u: Usuario = Depends(usuario_atual)):
    raise HTTPException(503, _SEM_ML)


@router.post("/busca")
def busca(_dados: Busca, _u: Usuario = Depends(usuario_atual)):
    raise HTTPException(503, _SEM_ML)


@router.post("/estudo")
def estudo(dados: Estudo, u: Usuario = Depends(usuario_atual), _db: Session = Depends(get_db)):
    imposto = dados.imposto if dados.imposto > 0 else u.imposto_padrao
    conteudo = estudo_planilha.planilha(dados.pesquisa, dados.filtro, imposto, dados.itens)
    nome = "estudo-monvatti.xlsx"
    return Response(conteudo, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})
