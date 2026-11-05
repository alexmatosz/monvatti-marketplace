"""Lógica do estudo de anúncios do Mercado Livre.

Portada do Replique (backend/_referencia_estudo_replique.py), adaptada para a
conta de estudo única (ml.cliente_ml) e para o usuário por login (sem empresa
nem pareamento). As estimativas de venda seguem a mesma régua do Replique.
"""

from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone

import httpx
from sqlalchemy.orm import Session

from backend import config
from backend.ml import ErroML, cliente_ml
from backend.models import LeituraEstudo, Usuario, agora

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


def avaliacao_mais_antiga(item_id: str, paginas: int = PAGINAS_AVALIACOES) -> str | None:
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
    primeira_avaliacao = None if criado_em else _iso(avaliacao_mais_antiga(item_id))
    evidencias = sorted(((d, f) for d, f in ((primeira_avaliacao, "avaliacao"), (primeira_pergunta, "pergunta")) if d),
                        key=lambda x: -(_dias_desde(x[0]) or 0))
    if criado_em:
        no_ar_desde, fonte_data = criado_em, "anuncio"
    elif evidencias:
        no_ar_desde, fonte_data = evidencias[0]
    elif catalogo_criado:
        no_ar_desde, fonte_data = catalogo_criado, "catalogo"
    else:
        no_ar_desde, fonte_data = None, None
    dias_anuncio = _dias_desde(no_ar_desde)
    dias_vida = max(dias_anuncio or 0, _dias_desde(catalogo_criado) or 0) or None
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
        return {"preco": _num(it.get("preco")), "primeira_avaliacao": _iso(avaliacao_mais_antiga(it["item_id"])),
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
        datas = [d for d in (c["primeira_avaliacao"], c["primeira_pergunta"]) if d]
        no_ar_desde = max(datas, key=lambda d: _dias_desde(d) or 0) if datas else _iso(c.get("catalogo_criado"))
        dias = _dias_desde(no_ar_desde)
        dias_vida = max(dias or 0, _dias_desde(c.get("catalogo_criado")) or 0) or None
        try:
            t = tarifas(preco or 0, categoria)
        except (ErroML, httpx.HTTPError):
            t = {}
        if categoria and t and categoria not in categorias:
            categorias[categoria] = {k: v["pct"] for k, v in t.items()}
        m = metricas(vendidos, patamar, preco, None, dias_vida, dias)
        saida.append({"item_id": it["item_id"], "no_ar_desde": no_ar_desde, "dias": dias,
                      "fonte_data": "avaliacao" if no_ar_desde and no_ar_desde == c["primeira_avaliacao"] else
                                    "pergunta" if no_ar_desde and no_ar_desde == c["primeira_pergunta"] else
                                    ("catalogo" if no_ar_desde else None),
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
                base.update({"titulo": d.get("name") or idx, "restrito": False,
                             "preco": (d.get("buy_box_winner") or {}).get("price"),
                             "thumbnail": fotos[0].get("url", "") if fotos else "",
                             "permalink": d.get("permalink") or f"https://www.mercadolivre.com.br/p/{idx}"})
        elif c.get("type") == "ITEM":
            base["permalink"] = f"https://produto.mercadolivre.com.br/{idx[:3]}-{idx[3:]}"
            it = ad._get(f"/items/{idx}")
            if it.status_code < 400:
                j = it.json()
                base.update({"titulo": j.get("title", ""), "restrito": False, "preco": _num(j.get("price")),
                             "thumbnail": (j.get("thumbnail") or "").replace("http://", "https://"),
                             "vendidos": j.get("sold_quantity")})
        else:
            base["permalink"] = f"https://www.mercadolivre.com.br/up/{idx}"
        return base

    with ThreadPoolExecutor(8) as ex:
        itens = list(ex.map(resolver, conteudo))
    return {"categoria_id": categoria_id, "categoria": nome_cat, "itens": itens}


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
