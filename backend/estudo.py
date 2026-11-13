"""Endpoints usados pela extensão.

- /versao  — a versão que o servidor espera da extensão;
- /eu      — quem está logado, imposto padrão e conta do ML detectada;
- /estudo  — gera a planilha .xlsx a partir dos itens coletados na página;
- /anuncio, /tarifas, /busca — métricas e taxas do anúncio pela conta de estudo
             do Mercado Livre — a conta que o cliente autorizou (landing ou
             popup) ou, na falta dela, a conta central. Sem nenhuma, 503.
"""

import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, estudo_ml, estudo_planilha, ml
from backend.auth import usuario_atual
from backend.db import get_db
from backend.ml import ErroML, conta_ml_do_usuario
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


class Metricas(BaseModel):
    item_id: str = Field(max_length=40)


class RadarNovo(BaseModel):
    item_id: str = Field(max_length=40)
    produto_id: str = Field(default="", max_length=40)
    titulo: str = Field(default="", max_length=300)
    thumbnail: str = Field(default="", max_length=400)
    permalink: str = Field(default="", max_length=400)
    termo: str = Field(default="", max_length=120)
    preco: float | None = None
    posicao: int | None = None


class RadarAtualizar(BaseModel):
    posicoes: dict[str, int | None] = Field(default_factory=dict)


class Ranqueamento(BaseModel):
    item_id: str = Field(default="", max_length=40)
    termo: str = Field(default="", max_length=120)


def _slug(texto: str) -> str:
    """Nome de arquivo só com a-z, 0-9 e hífen (o cabeçalho HTTP não aceita acento)."""
    sem_acento = unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sem_acento.lower()).strip("-")[:50]


@router.get("/versao")
def versao():
    return {"versao": config.VERSAO_EXTENSAO, "landing": config.LANDING_URL, "suporte": config.EMAIL_SUPORTE}


@router.get("/eu")
def eu(conta_ml: str = "", u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    admin = u.papel == "admin"
    propria = db.query(ContaML).filter(ContaML.usuario_id == u.id).first()
    central = ml.conta_central(db)
    tem_propria, tem_central = ml._conectada(propria), ml._conectada(central)
    liberado = tem_propria or tem_central
    return {"ligado": True, "nome": u.nome, "imposto": u.imposto_padrao, "admin": admin, "papel": u.papel,
            "assinatura_ate": u.assinatura_ate.isoformat() if u.assinatura_ate else None,
            "conta": {"conta": conta_ml or "deslogado", "liberado": liberado, "motivo": "" if liberado else ml.CONECTE},
            "ml_conectado": liberado,
            "ml_propria": tem_propria, "ml_apelido": propria.apelido if tem_propria else "",
            "ml_central": tem_central, "ml_central_apelido": central.apelido if tem_central and admin else "",
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
    nome = f"estudo-{_slug(dados.pesquisa) or 'monvatti'}.xlsx"
    return Response(conteudo, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})


@router.post("/metricas")
def metricas(dados: Metricas, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.metricas_do_anuncio(db, u, dados.item_id)
    except ErroML as e:
        raise HTTPException(503, e.mensagem)


@router.get("/radar")
def radar(u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    return {"itens": estudo_ml.radar_listar(db, u)}


@router.post("/radar")
def radar_novo(dados: RadarNovo, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return estudo_ml.radar_adicionar(db, u, dados.model_dump())
    except ErroML as e:
        raise HTTPException(400, e.mensagem)


@router.delete("/radar/{item_id}")
def radar_tirar(item_id: str, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    estudo_ml.radar_remover(db, u, item_id)
    return {"ok": True}


@router.post("/radar/atualizar")
def radar_atualizar(dados: RadarAtualizar, u: Usuario = Depends(usuario_atual), db: Session = Depends(get_db)):
    try:
        return {"itens": estudo_ml.radar_atualizar(db, u, dados.posicoes)}
    except ErroML as e:
        raise HTTPException(503, e.mensagem)
