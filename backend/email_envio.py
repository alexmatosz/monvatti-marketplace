"""Envio de e-mail (código de login e boas-vindas após o pagamento).

Usa SMTP puro, então serve Gmail (senha de app), Resend (smtp.resend.com) ou
qualquer outro provedor. Sem SMTP_HOST configurado, o e-mail não sai: o
conteúdo vai para o log do servidor, o que basta para testar na máquina.
"""

import html
import logging
import smtplib
import ssl
from email.message import EmailMessage

from backend import config

log = logging.getLogger("monvatti.email")


class ErroEmail(Exception):
    pass


def _moldura(titulo: str, corpo_html: str) -> str:
    return f"""<!doctype html><html><body style="margin:0;background:#f3f4f7;font-family:Segoe UI,Arial,sans-serif;color:#2B333B">
  <div style="max-width:480px;margin:0 auto;padding:28px 16px">
    <div style="background:#2B333B;color:#fff;border-radius:12px 12px 0 0;padding:16px 20px;font-weight:700">Monvatti Marketplace</div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:22px 20px;border:1px solid #e4e6ea;border-top:0">
      <h1 style="font-size:18px;margin:0 0 12px">{html.escape(titulo)}</h1>
      {corpo_html}
      <p style="font-size:12px;color:#8a93a3;margin:22px 0 0">Dúvidas? Responda este e-mail ou escreva para {html.escape(config.EMAIL_SUPORTE)}.</p>
    </div>
  </div></body></html>"""


def enviar(para: str, assunto: str, texto: str, corpo_html: str) -> None:
    if not config.SMTP_HOST:
        log.warning("SMTP não configurado; e-mail para %s não enviado.\nAssunto: %s\n%s", para, assunto, texto)
        return
    msg = EmailMessage()
    msg["From"] = config.EMAIL_REMETENTE
    msg["To"] = para
    msg["Subject"] = assunto
    if config.EMAIL_SUPORTE:
        msg["Reply-To"] = config.EMAIL_SUPORTE
    msg.set_content(texto)
    msg.add_alternative(corpo_html, subtype="html")
    try:
        contexto = ssl.create_default_context()
        if config.SMTP_PORTA == 465:
            with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORTA, context=contexto, timeout=15) as s:
                s.login(config.SMTP_USUARIO, config.SMTP_SENHA)
                s.send_message(msg)
        else:
            with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORTA, timeout=15) as s:
                s.starttls(context=contexto)
                s.login(config.SMTP_USUARIO, config.SMTP_SENHA)
                s.send_message(msg)
    except (smtplib.SMTPException, OSError) as e:
        log.exception("Falha ao enviar e-mail para %s", para)
        raise ErroEmail("Não consegui enviar o e-mail agora. Tente de novo em instantes.") from e


def enviar_codigo(para: str, codigo: str) -> None:
    minutos = config.CODIGO_MINUTOS
    texto = (f"Seu código para entrar no Monvatti Marketplace: {codigo}\n\n"
             f"Ele vale por {minutos} minutos. Se não foi você, ignore este e-mail.")
    corpo = (f'<p style="margin:0 0 14px">Use este código para entrar na extensão:</p>'
             f'<div style="font-size:30px;font-weight:700;letter-spacing:8px;background:#e9ebff;color:#0014a6;'
             f'border-radius:10px;padding:14px;text-align:center">{codigo}</div>'
             f'<p style="font-size:13px;color:#5b6472;margin:14px 0 0">Vale por {minutos} minutos. '
             f'Se não foi você, ignore este e-mail.</p>')
    enviar(para, f"{codigo} é seu código do Monvatti Marketplace", texto, _moldura("Seu código de acesso", corpo))


def enviar_boas_vindas(para: str, nome: str, ate_br: str, teste: bool = False) -> None:
    link = config.LINK_EXTENSAO or f"{config.LANDING_URL}/obrigado"
    primeiro = html.escape((nome or "").split(" ")[0] or "tudo certo")
    abertura = "Acesso de teste liberado!" if teste else "Pagamento confirmado!"
    frase = "Seu acesso de teste foi liberado" if teste else "Seu pagamento foi confirmado"
    texto = (f"{abertura} Seu acesso ao Monvatti Marketplace vale até {ate_br}.\n\n"
             f"1) Instale a extensão: {link}\n"
             f"2) Clique no ícone da Monvatti no Chrome e entre com este e-mail ({para}).\n"
             f"3) Você recebe um código por e-mail; cole na extensão e pronto.")
    corpo = (f'<p style="margin:0 0 12px">Oi, {primeiro}! {frase} e o acesso vale até <b>{html.escape(ate_br)}</b>.</p>'
             f'<ol style="padding-left:18px;margin:0 0 16px;line-height:1.6">'
             f'<li>Instale a extensão no Chrome.</li>'
             f'<li>Clique no ícone da Monvatti e entre com <b>{html.escape(para)}</b>.</li>'
             f'<li>Cole o código que chegar por e-mail.</li></ol>'
             f'<a href="{html.escape(link)}" style="display:inline-block;background:#001AD8;color:#fff;text-decoration:none;'
             f'font-weight:700;padding:11px 18px;border-radius:8px">Instalar a extensão</a>')
    enviar(para, ("Acesso de teste liberado" if teste else "Pagamento confirmado") + ": instale o Monvatti Marketplace", texto, _moldura("Acesso liberado", corpo))
