"""Lógica do estudo de anúncios do Mercado Livre.

Lógica do estudo, adaptada para a
conta de estudo única (ml.cliente_ml) e para o usuário por login (sem empresa
nem pareamento). As estimativas de venda partem do número público de vendidos.
"""

from __future__ import annotations

import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone

import httpx
from sqlalchemy.orm import Session

from backend import config
from backend.ml import ErroML, cliente_ml
from backend.models import LeituraEstudo, RadarItem, Usuario, agora

FATOR_PATAMAR = 1.5525
PAGINAS_AVALIACOES = 5
DIAS_MES = 30.44
_TIPOS = {"gold_pro": "Premium", "gold_special": "Clássico", "free": "Grátis"}
_LOGISTICAS = {"fulfillment": "Full", "self_service": "Flex", "cross_docking": "Coleta", "drop_off": "Correios",
               "xd_drop_off": "Places"}

_AVALIACOES_URL = "https://www.mercadolivre.com.br/noindex/catalog/reviews/{item}/search"
_NAVEGADOR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/131.0 Safari/537.36", "Accept": "application/json"}


def _texto(v, n: int) -> str:
    return str(v or "")[:n]


def _num(v) -> float | None:
    try:
        return float(v) if v not in (None, "") else None
    except (TypeError, ValueError):
        return None


def numero_vendidos(texto: str) -> tuple[int | None, bool]:
    t = (texto or "").lower().replace("\xa0", " ")
    m = re.search(r"(\+)?\s*([\d.,]+)\s*(mil|mi)?\s*vendid", t)
    if not m:
        return None, False
    n = float(m.group(2).replace(".", "").replace(",", "."))
    n *= {"mil": 1000, "mi": 1_000_000}.get(m.group(3) or "", 1)
    return int(n), bool(m.group(1))


def estimar_vendas(vendidos: int | None, patamar: bool) -> int | None:
    if vendidos is None or not patamar:
        return vendidos
    return round(vendidos * FATOR_PATAMAR)


def _dias_desde(iso: str | None) -> int | None:
    if not iso:
        return None
    try:
        d = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return max((datetime.now(timezone.utc) - d).days, 1)


def _iso(valor: str | None) -> str | None:
    if not valor:
        return None
    try:
        return datetime.fromisoformat(re.sub(r"(\.\d{6})\d+", r"\1", str(valor))).isoformat()
    except ValueError:
        return None


# A avaliação mais antiga custa até 5 leituras da página de avaliações por
# anúncio; ela quase não muda, então fica guardada (7 dias; sem avaliação, 1 dia).
_avaliacoes: dict[str, tuple[float, str | None]] = {}
_trava_avaliacoes = threading.Lock()


def avaliacao_mais_antiga(item_id: str, paginas: int = PAGINAS_AVALIACOES) -> str | None:
    with _trava_avaliacoes:
        guardada = _avaliacoes.get(item_id)
    if guardada and guardada[0] > time.time():
        return guardada[1]
    resultado = _avaliacao_mais_antiga(item_id, paginas)
    with _trava_avaliacoes:
        if len(_avaliacoes) > 50_000:
            _avaliacoes.clear()
        _avaliacoes[item_id] = (time.time() + (7 if resultado else 1) * 86400, resultado)
    return resultado


def _avaliacao_mais_antiga(item_id: str, paginas: int) -> str | None:
    def pagina(offset: int) -> list[str]:
        try:
            r = httpx.get(_AVALIACOES_URL.format(item=item_id), headers=_NAVEGADOR, timeout=12,
                          params={"objectId": item_id, "siteId": "MLB", "isItem": "true", "offset": offset, "limit": 20})
        except httpx.HTTPError:
            return []
        return re.findall(r'"created_date"\s*:\s*"(20\d\d-\d\d-\d\dT[\d:]+)', r.text) if r.status_code < 400 else []
    with ThreadPoolExecutor(paginas) as ex:
        datas = [d for lista in ex.map(pagina, range(0, paginas * 20, 20)) for d in lista]
    return min(datas) + "Z" if datas else None


def data_de_vida(primeira_avaliacao: str | None, primeira_pergunta: str | None,
                 catalogo_criado: str | None, em_catalogo: bool) -> tuple[str | None, str | None]:
    """Desde quando o anúncio está no ar, pela evidência mais antiga que é DELE.

    Em anúncio de catálogo as avaliações são do produto inteiro (todos os vendedores,
    anúncios antigos), então não servem para datar este anúncio: vale a criação do
    catálogo. Fora do catálogo, a avaliação mais antiga é do próprio anúncio. A 1ª
    pergunta é sempre do anúncio, nos dois casos.
    """
    candidatos = [(primeira_pergunta, "pergunta")]
    candidatos.append((catalogo_criado, "catalogo") if em_catalogo else (primeira_avaliacao, "avaliacao"))
    candidatos = [(d, f) for d, f in candidatos if d]
    if not candidatos and catalogo_criado:
        candidatos = [(catalogo_criado, "catalogo")]
    if not candidatos:
        return None, None
    return max(candidatos, key=lambda x: _dias_desde(x[0]) or 0)


def nome_logistica(codigo: str, flex: bool = False) -> str:
    nome = _LOGISTICAS.get(codigo, codigo)
    if flex and codigo not in ("self_service", "fulfillment") and nome:
        return f"{nome} + Flex"
    return nome


def metricas(vendidos: int | None, patamar: bool, preco: float | None, visitas: int | None,
             dias_vida: int | None, dias_anuncio: int | None = None, hoje: date | None = None) -> dict:
    estimadas = estimar_vendas(vendidos, patamar)
    dias_anuncio = dias_anuncio or dias_vida
    saida = {"vendidos": vendidos, "patamar": patamar, "vendas_estimadas": estimadas, "visitas": visitas,
             "dias": dias_vida, "vendas_dia": None, "vendas_dia_exata": None, "vendas_mes": None, "ritmo_mes": None,
             "conversao_pct": None, "faturamento": None, "periodos": None}
    if vendidos == 0:
        saida["vendas_dia"] = saida["vendas_dia_exata"] = saida["vendas_mes"] = 0
    elif vendidos is not None and dias_vida:
        saida["vendas_dia"] = round(vendidos / dias_vida)
        saida["vendas_dia_exata"] = round(vendidos / dias_vida, 2)
        saida["vendas_mes"] = int(vendidos / dias_vida * 30)
    if estimadas is not None and dias_anuncio:
        terco_meses = max(dias_anuncio / DIAS_MES / 3, 1 / DIAS_MES)
        saida["ritmo_mes"] = round(estimadas * 0.4 / terco_meses)
    if vendidos is not None and visitas:
        saida["conversao_pct"] = round(vendidos / visitas * 100, 2)
    if vendidos is not None and preco:
        saida["faturamento"] = round(vendidos * preco, 2)
    if saida["ritmo_mes"] is not None:
        por_dia = saida["ritmo_mes"] / 30
        dia_do_mes = (hoje or date.today()).day
        saida["periodos"] = {
            "total": {"vendas": vendidos, "faturamento": saida["faturamento"]},
            **{chave: {"vendas": round(por_dia * n), "faturamento": round(por_dia * n * preco, 2) if preco else None}
               for chave, n in (("d30", 30), ("d7", 7), ("mes", min(dia_do_mes, (dias_anuncio or 30))))}}
    return saida


def _tarifas(ad, preco: float, categoria: str) -> dict:
    saida = {}
    todas = ad.tarifas_de_venda(preco, categoria) if preco else {}
    for tipo in ("gold_special", "gold_pro"):
        t = todas.get(tipo)
        if t and "sale_fee_amount" in t:
            detalhes = t.get("sale_fee_details") or {}
            saida[tipo] = {"comissao": float(t.get("sale_fee_amount") or 0) - float(detalhes.get("fixed_fee") or 0),
                           "taxa_fixa": float(detalhes.get("fixed_fee") or 0),
                           "pct": float(detalhes.get("percentage_fee") or 0)}
    return saida


def _frete(ad, preco: float, categoria: str, tipo: str, vendedor_id: str = "", item_id: str = "") -> dict | None:
    if not preco:
        return None
    if vendedor_id and item_id:
        f = ad.frete_do_anuncio(vendedor_id, item_id, preco)
        if f:
            return {**f, "fonte": "anuncio"}
    if not categoria:
        return None
    medidas = ad.medidas_da_categoria(categoria)
    custo = ad.custo_frete_gratis(preco, medidas, tipo) if medidas else None
    return {"custo": custo, "peso_g": None, "fonte": "categoria"} if custo is not None else None


def _vendedor(ad, seller_id: str) -> dict:
    if not seller_id:
        return {}
    r = ad._get(f"/users/{seller_id}")
    if r.status_code >= 400:
        return {"id": seller_id}
    u = r.json()
    rep = u.get("seller_reputation") or {}
    return {"id": seller_id, "apelido": u.get("nickname", ""), "termometro": rep.get("level_id") or "",
            "medalha": rep.get("power_seller_status") or "",
            "vendas_total": (rep.get("transactions") or {}).get("total"),
            "cidade": (u.get("address") or {}).get("city", ""),
            "uf": str((u.get("address") or {}).get("state", "")).removeprefix("BR-")}


def custos_de_venda(db: Session, usuario: Usuario, preco: float, categoria: str, tipo: str,
                    vendedor_id: str = "", item_id: str = "") -> dict:
    if not preco or preco <= 0:
        raise ErroML("Informe um preço de venda maior que zero.")
    if not re.fullmatch(r"MLB\d+", categoria or ""):
        raise ErroML("Categoria do anúncio não encontrada. Abra a página de um anúncio.")
    ad = cliente_ml(db, usuario)
    frete = _frete(ad, preco, categoria, tipo or "gold_special", vendedor_id, item_id)
    return {"preco": preco, "tarifas": _tarifas(ad, preco, categoria),
            "frete": frete["custo"] if frete else None, "frete_peso_g": frete["peso_g"] if frete else None}


def analisar(db: Session, usuario: Usuario, pagina: dict) -> dict:
    item_id = _texto(pagina.get("item_id"), 40).upper()
    if not re.fullmatch(r"MLB\d{6,}", item_id):
        raise ErroML("Não achei o código do anúncio (MLB…) nesta página.")
    produto_id = _texto(pagina.get("produto_id"), 40).upper()
    ad = cliente_ml(db, usuario)
    vendidos, patamar = numero_vendidos(_texto(pagina.get("vendidos_texto"), 60))
    if vendidos is None and _num(pagina.get("vendidos")) is not None:
        vendidos, patamar = int(_num(pagina.get("vendidos"))), True
    preco = _num(pagina.get("preco"))
    categoria = _texto(pagina.get("categoria_id"), 30)
    tipo = _texto(pagina.get("tipo_anuncio"), 30) or "gold_special"
    vendedor_id = re.sub(r"\D", "", _texto(pagina.get("vendedor_id"), 30))
    criado_em = None
    visitas = None
    try:
        r = ad._get(f"/items/{item_id}")
        if r.status_code < 400:
            it = r.json()
            criado_em = it.get("date_created") or it.get("start_time")
            categoria = categoria or it.get("category_id") or ""
            tipo = it.get("listing_type_id") or tipo
            preco = preco or _num(it.get("price"))
            vendedor_id = vendedor_id or str(it.get("seller_id") or "")
        v = ad._get("/visits/items", {"ids": item_id})
        if v.status_code < 400:
            visitas = int((v.json() or {}).get(item_id) or 0)
        perguntas = ad.primeira_pergunta(item_id)
        catalogo_criado = None
        if produto_id:
            p = ad._get(f"/products/{produto_id}")
            if p.status_code < 400:
                catalogo_criado = p.json().get("date_created")
        tarifas = _tarifas(ad, preco or 0, categoria)
        frete = _frete(ad, preco or 0, categoria, tipo, vendedor_id, item_id)
        vendedor = _vendedor(ad, vendedor_id)
    except ErroML as e:
        raise ErroML(e.mensagem) from e
    except httpx.HTTPError as e:
        raise ErroML("O Mercado Livre não respondeu agora. Recarregue a página em alguns segundos.") from e
    primeira_pergunta = _iso(perguntas.get("primeira"))
    em_catalogo = bool(produto_id)
    primeira_avaliacao = None if criado_em or em_catalogo else _iso(avaliacao_mais_antiga(item_id))
    if criado_em:
        no_ar_desde, fonte_data = criado_em, "anuncio"
    else:
        no_ar_desde, fonte_data = data_de_vida(primeira_avaliacao, primeira_pergunta, catalogo_criado, em_catalogo)
    dias_anuncio = _dias_desde(no_ar_desde)
    dias_vida = dias_anuncio
    saida = {"item_id": item_id, "produto_id": produto_id, "titulo": _texto(pagina.get("titulo"), 300),
             "preco": preco, "categoria_id": categoria, "tipo_id": tipo, "tipo_anuncio": _TIPOS.get(tipo, tipo),
             "logistica": nome_logistica(_texto(pagina.get("logistica"), 30), bool(pagina.get("flex"))),
             "estoque": _num(pagina.get("estoque")), "criado_em": criado_em, "no_ar_desde": no_ar_desde,
             "data_aproximada": not criado_em and bool(no_ar_desde), "fonte_data": fonte_data,
             "dias_anuncio": dias_anuncio, "primeira_pergunta": primeira_pergunta, "primeira_avaliacao": primeira_avaliacao,
             "perguntas": perguntas.get("total"), "visitas_liberadas": visitas is not None,
             "catalogo_criado_em": catalogo_criado, "dias_catalogo": _dias_desde(catalogo_criado), "tarifas": tarifas,
             "frete": frete["custo"] if frete else None, "frete_peso_g": frete["peso_g"] if frete else None,
             "frete_fonte": frete["fonte"] if frete else None, "vendedor": vendedor,
             "imposto_padrao": config.IMPOSTO_PADRAO, **metricas(vendidos, patamar, preco, visitas, dias_vida, dias_anuncio)}
    _guardar_leitura(db, usuario, saida, _texto(pagina.get("vendidos_texto"), 40), pagina.get("patrocinado"))
    saida["historico"] = historico(db, item_id)
    return saida


def _guardar_leitura(db: Session, usuario: Usuario, m: dict, vendidos_texto: str, patrocinado) -> None:
    hoje = date.today()
    leitura = db.query(LeituraEstudo).filter_by(item_id=m["item_id"], dia=hoje).first()
    if not leitura:
        leitura = LeituraEstudo(item_id=m["item_id"], dia=hoje)
        db.add(leitura)
    leitura.usuario_id = usuario.id
    leitura.produto_id = m["produto_id"]
    leitura.titulo = m["titulo"]
    leitura.vendidos = m["vendidos"]
    leitura.vendidos_texto = vendidos_texto
    leitura.preco = m["preco"]
    leitura.visitas = m["visitas"]
    if patrocinado is not None:
        leitura.patrocinado = bool(patrocinado)
    leitura.dados = {"vendedor": m["vendedor"].get("apelido", ""), "logistica": m["logistica"], "tipo": m["tipo_anuncio"]}
    leitura.lida_em = agora()
    db.commit()


def historico(db: Session, item_id: str, limite: int = 90) -> list[dict]:
    linhas = (db.query(LeituraEstudo).filter_by(item_id=item_id)
              .order_by(LeituraEstudo.dia.desc()).limit(limite).all())
    return [{"dia": x.dia.isoformat(), "vendidos": x.vendidos, "vendidos_texto": x.vendidos_texto, "preco": x.preco,
             "visitas": x.visitas, "patrocinado": x.patrocinado} for x in reversed(linhas)]


def _id_anuncio(valor) -> str:
    item_id = _texto(valor, 40).upper()
    return item_id if re.fullmatch(r"MLB\d{9,10}", item_id) else ""


def analisar_busca(db: Session, usuario: Usuario, itens: list[dict]) -> dict:
    ad = cliente_ml(db, usuario)
    hoje = date.today()
    validos = []
    for it in itens[:100]:
        item_id = _id_anuncio(it.get("item_id"))
        if item_id and item_id not in {v["item_id"] for v in validos}:
            validos.append({**it, "item_id": item_id})
    guardadas = {x.item_id: x for x in db.query(LeituraEstudo).filter(
        LeituraEstudo.dia == hoje,
        LeituraEstudo.item_id.in_([v["item_id"] for v in validos] or [""]))}
    vendedores: dict[str, dict] = {}
    tarifas_cache: dict[tuple, dict] = {}

    def tarifas(preco: float, categoria: str) -> dict:
        chave = (categoria, round(preco, 2))
        if chave not in tarifas_cache:
            tarifas_cache[chave] = _tarifas(ad, preco, categoria) if preco and categoria else {}
        return tarifas_cache[chave]

    def coletar(it: dict) -> dict:
        antes = (guardadas.get(it["item_id"]).dados or {}).get("busca") if guardadas.get(it["item_id"]) else None
        novo_vendedor = re.sub(r"[^0-9]", "", _texto(it.get("vendedor_id"), 30))
        if (antes and antes.get("preco") == _num(it.get("preco")) and "catalogo_criado" in antes
                and (not novo_vendedor or antes.get("vendedor_id") == novo_vendedor)):
            return antes
        vendedor_id = re.sub(r"\D", "", _texto(it.get("vendedor_id"), 30))
        produto_id = _texto(it.get("produto_id"), 40).upper()
        vendedores_catalogo = catalogo_criado = None
        try:
            perguntas = ad.primeira_pergunta(it["item_id"])
            vendedor_id = vendedor_id or perguntas.get("vendedor_id") or ""
            frete = ad.frete_do_anuncio(vendedor_id, it["item_id"], _num(it.get("preco"))) if vendedor_id else None
            if re.fullmatch(r"MLB\d+", produto_id):
                r = ad._get(f"/products/{produto_id}/items", {"limit": 1})
                if r.status_code < 400:
                    vendedores_catalogo = (r.json().get("paging") or {}).get("total")
                p = ad._get(f"/products/{produto_id}")
                if p.status_code < 400:
                    catalogo_criado = p.json().get("date_created")
        except (ErroML, httpx.HTTPError):
            perguntas, frete = {}, None
        em_catalogo = bool(re.fullmatch(r"MLB\d+", produto_id))
        return {"preco": _num(it.get("preco")), "em_catalogo": em_catalogo,
                "primeira_avaliacao": None if em_catalogo else _iso(avaliacao_mais_antiga(it["item_id"])),
                "primeira_pergunta": _iso(perguntas.get("primeira")), "perguntas": perguntas.get("total"),
                "vendedor_id": vendedor_id, "frete": frete["custo"] if frete else None,
                "vendedores_catalogo": vendedores_catalogo, "catalogo_criado": catalogo_criado}

    def vendedor(vid: str) -> dict:
        try:
            return _vendedor(ad, vid)
        except (ErroML, httpx.HTTPError):
            return {"id": vid}

    def tarifa_segura(chave: tuple) -> None:
        try:
            tarifas(chave[1], chave[0])
        except (ErroML, httpx.HTTPError):
            tarifas_cache[chave] = {}

    with ThreadPoolExecutor(16) as ex:
        precos = {(_texto(it.get("categoria_id"), 30), round(_num(it.get("preco")) or 0, 2)) for it in validos}
        pedidos_tarifa = [ex.submit(tarifa_segura, c) for c in precos if c[0] and c[1]]
        coletados = list(ex.map(coletar, validos))
        ids_vendedores = sorted({c["vendedor_id"] for c in coletados if c["vendedor_id"]})
        vendedores.update(zip(ids_vendedores, ex.map(vendedor, ids_vendedores)))
        for f in pedidos_tarifa:
            f.result()
    categorias: dict[str, dict] = {}
    saida = []
    for it, c in zip(validos, coletados):
        preco = _num(it.get("preco"))
        categoria = _texto(it.get("categoria_id"), 30)
        vendidos, patamar = numero_vendidos(_texto(it.get("vendidos_texto"), 60))
        if vendidos is None:
            vendidos, patamar = 0, False
        em_catalogo = c.get("em_catalogo", bool(c.get("catalogo_criado")))
        no_ar_desde, fonte_data = data_de_vida(None if em_catalogo else c["primeira_avaliacao"], c["primeira_pergunta"],
                                               _iso(c.get("catalogo_criado")), em_catalogo)
        dias = dias_vida = _dias_desde(no_ar_desde)
        try:
            t = tarifas(preco or 0, categoria)
        except (ErroML, httpx.HTTPError):
            t = {}
        if categoria and t and categoria not in categorias:
            categorias[categoria] = {k: v["pct"] for k, v in t.items()}
        m = metricas(vendidos, patamar, preco, None, dias_vida, dias)
        saida.append({"item_id": it["item_id"], "no_ar_desde": no_ar_desde, "dias": dias,
                      "fonte_data": fonte_data,
                      "perguntas": c["perguntas"], "frete": c["frete"], "tarifas": t,
                      "vendedores_catalogo": c.get("vendedores_catalogo"),
                      "tipo": _texto(it.get("tipo"), 30), "logistica": _texto(it.get("logistica"), 30),
                      "vendedor": vendedores.get(c["vendedor_id"], {}), **m})
        leitura = guardadas.get(it["item_id"])
        if not leitura:
            leitura = LeituraEstudo(item_id=it["item_id"], dia=hoje, usuario_id=usuario.id,
                                    titulo=_texto(it.get("titulo"), 300), produto_id=_texto(it.get("produto_id"), 40).upper())
            db.add(leitura)
            guardadas[it["item_id"]] = leitura
        if vendidos is not None:
            leitura.vendidos, leitura.vendidos_texto = vendidos, _texto(it.get("vendidos_texto"), 40)
        leitura.preco = preco or leitura.preco
        leitura.patrocinado = bool(it.get("patrocinado")) or bool(leitura.patrocinado)
        leitura.dados = {**(leitura.dados or {}), "busca": c}
    db.commit()
    return {"itens": saida, "categorias": categorias}


def _categoria_do_termo(ad, termo: str) -> tuple[str, str]:
    r = ad._get(f"/sites/{config.ML_SITE_ID}/domain_discovery/search", {"q": termo, "limit": 1}, auth=False)
    if r.status_code < 400 and isinstance(r.json(), list) and r.json():
        d = r.json()[0]
        return d.get("category_id") or "", d.get("category_name") or ""
    return "", ""


def tendencia(db: Session, usuario: Usuario, termo: str = "", categoria_id: str = "", limite: int = 20) -> dict:
    """Os mais vendidos de uma categoria (ranking oficial do ML, via /highlights).
    Aceita um termo (descobre a categoria) ou uma categoria direto."""
    ad = cliente_ml(db, usuario)
    categoria_id = _texto(categoria_id, 40).upper()
    nome_cat = ""
    if not re.fullmatch(r"MLB\d+", categoria_id) and termo:
        categoria_id, nome_cat = _categoria_do_termo(ad, termo.strip())
    if not re.fullmatch(r"MLB\d+", categoria_id or ""):
        raise ErroML("Não achei a categoria. Tente um termo de produto mais específico.")
    if not nome_cat:
        rc = ad._get(f"/categories/{categoria_id}", auth=False)
        nome_cat = rc.json().get("name", categoria_id) if rc.status_code < 400 else categoria_id
    r = ad._get(f"/highlights/{config.ML_SITE_ID}/category/{categoria_id}")
    if r.status_code >= 400:
        raise ErroML("O Mercado Livre não tem ranking de mais vendidos para essa categoria.")
    conteudo = (r.json().get("content") or [])[:limite]

    def resolver(c: dict) -> dict:
        idx = _texto(c.get("id"), 40)
        base = {"posicao": c.get("position"), "tipo": c.get("type"), "id": idx,
                "titulo": "", "preco": None, "thumbnail": "", "permalink": "", "restrito": True}
        if c.get("type") == "PRODUCT":
            p = ad._get(f"/products/{idx}", auth=False)
            if p.status_code < 400:
                d = p.json()
                fotos = d.get("pictures") or []
                vencedor = d.get("buy_box_winner") or {}
                base.update({"titulo": d.get("name") or idx, "restrito": False, "item_ref": vencedor.get("item_id") or "",
                             "preco": vencedor.get("price"),
                             "thumbnail": fotos[0].get("url", "") if fotos else "",
                             "permalink": d.get("permalink") or f"https://www.mercadolivre.com.br/p/{idx}"})
        elif c.get("type") == "ITEM":
            base["permalink"] = f"https://produto.mercadolivre.com.br/{idx[:3]}-{idx[3:]}"
            it = ad._get(f"/items/{idx}")
            if it.status_code < 400:
                j = it.json()
                base.update({"titulo": j.get("title", ""), "restrito": False, "preco": _num(j.get("price")), "item_ref": idx,
                             "thumbnail": (j.get("thumbnail") or "").replace("http://", "https://"),
                             "vendidos": j.get("sold_quantity")})
        else:
            base["permalink"] = f"https://www.mercadolivre.com.br/up/{idx}"
        return base

    with ThreadPoolExecutor(8) as ex:
        itens = list(ex.map(resolver, conteudo))
    _visitas_do_ranking(ad, itens)
    precos = [x["preco"] for x in itens if x.get("preco")]
    resumo = {"preco_min": min(precos) if precos else None, "preco_max": max(precos) if precos else None,
              "preco_medio": round(sum(precos) / len(precos), 2) if precos else None,
              "visitas_total": sum(x.get("visitas") or 0 for x in itens) or None,
              "vendidos_total": sum(x.get("vendidos") or 0 for x in itens) or None}
    return {"categoria_id": categoria_id, "categoria": nome_cat, "itens": itens, "resumo": resumo}


def _dias_atras(n: int) -> str:
    from datetime import timedelta
    return (date.today() - timedelta(days=n)).isoformat()


def _visitas_do_ranking(ad, itens: list[dict]) -> None:
    """Visitas dos últimos 30 dias de cada anúncio do ranking (num produto de
    catálogo, as do anúncio que está ganhando a compra)."""
    ids = [x["item_ref"] for x in itens if x.get("item_ref")]
    for n in range(0, len(ids), 50):
        lote = ids[n:n + 50]
        try:
            r = ad._get("/visits/items", {"ids": ",".join(lote), "date_from": _dias_atras(30), "date_to": _dias_atras(0)})
        except httpx.HTTPError:
            continue
        if r.status_code >= 400 or not isinstance(r.json(), dict):
            continue
        dados = r.json()
        for x in itens:
            if x.get("item_ref") in dados:
                x["visitas"] = int(dados[x["item_ref"]] or 0)


def ranqueamento(db: Session, usuario: Usuario, item_id: str, termo: str, paginas: int = 2) -> dict:
    """Em que posição um anúncio aparece na busca do ML para uma palavra-chave."""
    ad = cliente_ml(db, usuario)
    item_id = _texto(item_id, 40).upper()
    termo = _texto(termo, 120).strip()
    if not re.fullmatch(r"MLB\d{6,}", item_id):
        raise ErroML("Informe o código do anúncio (MLB…).")
    if not termo:
        raise ErroML("Informe uma palavra-chave para medir o ranqueamento.")
    por_pagina = 50
    posicao = None
    total = None
    for p in range(max(paginas, 1)):
        r = ad._get(f"/sites/{config.ML_SITE_ID}/search", {"q": termo, "limit": por_pagina, "offset": p * por_pagina})
        if r.status_code >= 400:
            if p == 0:
                raise ErroML("O Mercado Livre não liberou a busca agora. Tente de novo em instantes.")
            break
        d = r.json()
        total = (d.get("paging") or {}).get("total")
        resultados = d.get("results") or []
        for i, it in enumerate(resultados):
            if item_id in (str(it.get("id") or "").upper(), str(it.get("catalog_product_id") or "").upper()):
                posicao = p * por_pagina + i + 1
                break
        if posicao or not resultados:
            break
    return {"termo": termo, "item_id": item_id, "posicao": posicao,
            "limite": max(paginas, 1) * por_pagina, "total": total}


# ---------------------------------------------------------------- métricas

def metricas_do_anuncio(db: Session, usuario: Usuario, item_id: str) -> dict:
    """O que mudou no anúncio: preço (promoção x preço cheio e histórico visto pela
    Monvatti) e visitas dia a dia nos últimos 30 dias."""
    item_id = _texto(item_id, 40).upper()
    if not re.fullmatch(r"MLB\d{6,}", item_id):
        raise ErroML("Não achei o código do anúncio (MLB…) nesta página.")
    ad = cliente_ml(db, usuario)
    preco = {"atual": None, "cheio": None}
    visitas: list[dict] = []
    try:
        r = ad._get(f"/items/{item_id}")
        if r.status_code < 400:
            it = r.json()
            preco = {"atual": _num(it.get("price")), "cheio": _num(it.get("original_price"))}
        v = ad._get(f"/items/{item_id}/visits/time_window", {"last": 30, "unit": "day"})
        if v.status_code < 400:
            for x in (v.json() or {}).get("results") or []:
                dia = str(x.get("date") or "")[:10]
                if dia:
                    visitas.append({"dia": dia, "visitas": int(x.get("total") or 0)})
    except httpx.HTTPError as e:
        raise ErroML("O Mercado Livre não respondeu agora. Tente de novo em alguns segundos.") from e
    return {"item_id": item_id, "preco": preco, "visitas": visitas, "historico": historico(db, item_id)}


# ---------------------------------------------------------------- radar

LIMITE_RADAR = 50


def _radar_json(db: Session, x: RadarItem) -> dict:
    return {"item_id": x.item_id, "produto_id": x.produto_id, "titulo": x.titulo, "thumbnail": x.thumbnail,
            "permalink": x.permalink, "termo": x.termo, "preco_inicial": x.preco_inicial,
            "preco_anterior": x.preco_anterior, "preco_atual": x.preco_atual, "posicao_inicial": x.posicao_inicial,
            "posicao_anterior": x.posicao_anterior, "posicao_atual": x.posicao_atual,
            "criado_em": x.criado_em.isoformat() if x.criado_em else None,
            "verificado_em": x.verificado_em.isoformat() if x.verificado_em else None,
            "mudou_em": x.mudou_em.isoformat() if x.mudou_em else None,
            "historico": [{"dia": h["dia"], "preco": h["preco"]} for h in historico(db, x.item_id, 30) if h["preco"]]}


def radar_listar(db: Session, usuario: Usuario) -> list[dict]:
    itens = (db.query(RadarItem).filter_by(usuario_id=usuario.id, ativo=True)
             .order_by(RadarItem.criado_em.desc()).all())
    return [_radar_json(db, x) for x in itens]


def radar_adicionar(db: Session, usuario: Usuario, dados: dict) -> dict:
    item_id = _texto(dados.get("item_id"), 40).upper()
    if not re.fullmatch(r"MLB\d{6,}", item_id):
        raise ErroML("Não achei o código do anúncio (MLB…).")
    x = db.query(RadarItem).filter_by(usuario_id=usuario.id, item_id=item_id).first()
    if not x or not x.ativo:
        ativos = db.query(RadarItem).filter_by(usuario_id=usuario.id, ativo=True).count()
        if ativos >= LIMITE_RADAR:
            raise ErroML(f"O radar já tem {LIMITE_RADAR} anúncios. Tire algum antes de colocar outro.")
    if not x:
        x = RadarItem(usuario_id=usuario.id, item_id=item_id)
        db.add(x)
    preco = _num(dados.get("preco"))
    posicao = dados.get("posicao") if isinstance(dados.get("posicao"), int) and dados.get("posicao") > 0 else None
    x.ativo = True
    x.produto_id = _texto(dados.get("produto_id"), 40).upper()
    x.titulo = _texto(dados.get("titulo"), 300) or x.titulo or ""
    x.thumbnail = _texto(dados.get("thumbnail"), 400) or x.thumbnail or ""
    x.permalink = _texto(dados.get("permalink"), 400) or x.permalink or ""
    x.termo = _texto(dados.get("termo"), 120).strip()
    x.preco_inicial = x.preco_anterior = x.preco_atual = preco
    x.posicao_inicial = x.posicao_anterior = x.posicao_atual = posicao
    x.criado_em = agora()
    x.verificado_em = agora()
    x.mudou_em = None
    db.commit()
    return _radar_json(db, x)


def radar_remover(db: Session, usuario: Usuario, item_id: str) -> None:
    x = db.query(RadarItem).filter_by(usuario_id=usuario.id, item_id=_texto(item_id, 40).upper()).first()
    if x:
        x.ativo = False
        db.commit()


def radar_atualizar(db: Session, usuario: Usuario, posicoes: dict) -> list[dict]:
    """Confere o preço de todos os anúncios do radar (API do ML, de 20 em 20) e grava
    a posição na busca que a extensão mediu no navegador da pessoa."""
    itens = db.query(RadarItem).filter_by(usuario_id=usuario.id, ativo=True).all()
    if not itens:
        return []
    ad = cliente_ml(db, usuario)
    precos: dict[str, float] = {}
    ids = [x.item_id for x in itens]
    for n in range(0, len(ids), 20):
        try:
            r = ad._get("/items", {"ids": ",".join(ids[n:n + 20]), "attributes": "id,price"})
        except httpx.HTTPError:
            continue
        if r.status_code >= 400 or not isinstance(r.json(), list):
            continue
        for linha in r.json():
            corpo = (linha or {}).get("body") or {}
            if linha.get("code") == 200 and corpo.get("id") and _num(corpo.get("price")) is not None:
                precos[corpo["id"]] = _num(corpo["price"])
    hoje = date.today()
    for x in itens:
        mudou = False
        novo = precos.get(x.item_id)
        if novo is not None:
            if x.preco_atual is not None and abs(novo - x.preco_atual) >= 0.01:
                x.preco_anterior = x.preco_atual
                mudou = True
            x.preco_atual = novo
            if x.preco_inicial is None:
                x.preco_inicial = novo
            leitura = db.query(LeituraEstudo).filter_by(item_id=x.item_id, dia=hoje).first()
            if not leitura:
                db.add(LeituraEstudo(item_id=x.item_id, dia=hoje, usuario_id=usuario.id, titulo=x.titulo or "",
                                     produto_id=x.produto_id or "", preco=novo, dados={"origem": "radar"}))
            elif leitura.preco is None:
                leitura.preco = novo
        if x.item_id in posicoes:
            pos = posicoes[x.item_id]
            pos = pos if isinstance(pos, int) and pos > 0 else None
            if pos != x.posicao_atual and not (pos is None and x.posicao_atual is None):
                x.posicao_anterior = x.posicao_atual
                mudou = True
            x.posicao_atual = pos
            if x.posicao_inicial is None:
                x.posicao_inicial = pos
        x.verificado_em = agora()
        if mudou:
            x.mudou_em = agora()
    db.commit()
    return radar_listar(db, usuario)
