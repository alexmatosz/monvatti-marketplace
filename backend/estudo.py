"""Endpoints usados pela extensão.

- /versao  — a versão que o servidor espera da extensão;
- /eu      — quem está logado, imposto padrão e conta do ML detectada;
- /estudo  — gera a planilha .xlsx a partir dos itens coletados na página;
- /anuncio, /tarifas, /busca — métricas e taxas do anúncio pela conta de estudo
             do Mercado Livre (conecte em /api/ml/conectar). Sem a conta conectada,
             respondem 503 com a mensagem pedindo a conexão.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, estudo_ml, estudo_planilha
from backend.auth import usuario_atual
from backend.db import get_db
from backend.ml import ErroML
from backend.models import ContaML, Usuario

router = APIRouter(prefix="/api/extensao", tags=["extensao"])


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


class Tendencia(BaseModel):
    termo: str = Field(default="", max_length=120)
    categoria_id: str = Field(default="", max_length=40)


class Ranqueamento(BaseModel):
    item_id: str = Field(default="", max_length=40)
    termo: str = Field(default="", max_length=120)


@router.get("/versao")
def versao():
    return {"versao": config.VERSAO_EXTENSAO}


@router.get("/eu")
def eu(conta_ml: str = "", u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    conta = db.query(ContaML).filter(ContaML.usuario_id == u.id).first()
    conectado = bool(conta and (conta.credenciais or {}).get("access_token"))
    return {"ligado": True, "nome": u.nome, "imposto": u.imposto_padrao,
            "conta": {"conta": conta_ml or "deslogado"},
            "ml_conectado": conectado, "ml_apelido": conta.apelido if conta else "",
            "clientes": []}


@router.post("/anuncio")
def anuncio(dados: Pagina, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.analisar(db, u, dados.pagina)
    except ErroML as e:
        raise HTTPException(503, e.mensagem)


@router.post("/tarifas")
def tarifas(dados: Tarifas, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.custos_de_venda(db, u, dados.preco, dados.categoria_id, dados.tipo, dados.vendedor_id, dados.item_id)
    except ErroML as e:
        raise HTTPException(503, e.mensagem)


@router.post("/busca")
def busca(dados: Busca, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.analisar_busca(db, u, dados.itens)
    except ErroML as e:
        raise HTTPException(503, e.mensagem)


@router.post("/tendencia")
def tendencia(dados: Tendencia, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.tendencia(db, u, dados.termo, dados.categoria_id)
    except ErroML as e:
        raise HTTPException(503, e.mensagem)


@router.post("/ranqueamento")
def ranqueamento(dados: Ranqueamento, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.ranqueamento(db, u, dados.item_id, dados.termo)
    except ErroML as e:
        raise HTTPException(503, e.mensagem)


@router.post("/estudo")
def estudo(dados: Estudo, u: Usuario = Depends(usuario_atual), _db: Session = Depends(get_db)):
    imposto = dados.imposto if dados.imposto > 0 else u.imposto_padrao
    conteudo = estudo_planilha.planilha(dados.pesquisa, dados.filtro, imposto, dados.itens)
    nome = "estudo-monvatti.xlsx"
    return Response(conteudo, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})
