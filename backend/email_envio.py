"""Envio de e-mail (código de login). SMTP simples, sem dependência externa."""

import logging
import smtplib
import ssl
from email.message import EmailMessage

from backend import config

log = logging.getLogger("monvatti.email")


def configurado() -> bool:
    return bool(config.SMTP_HOST)


def enviar_codigo(para: str, nome: str, codigo: str) -> bool:
    """Manda o código. Sem SMTP configurado, só registra no log e devolve False."""
    if not configurado():
        log.warning("SMTP não configurado: código de login de %s é %s", para, codigo)
        return False
    msg = EmailMessage()
    msg["Subject"] = f"{codigo} é o seu código da Monvatti"
    msg["From"] = config.SMTP_REMETENTE
    msg["To"] = para
    msg.set_content(
        f"Olá{', ' + nome.split()[0] if nome else ''}!\n\n"
        f"Seu código para entrar na extensão Monvatti Marketplace é:\n\n    {codigo}\n\n"
        "Ele vale por 10 minutos. Se não foi você que pediu, ignore este e-mail.\n\n— Monvatti")
    contexto = ssl.create_default_context()
    if config.SMTP_PORTA == 465:
        with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORTA, context=contexto, timeout=20) as s:
            if config.SMTP_USUARIO:
                s.login(config.SMTP_USUARIO, config.SMTP_SENHA)
            s.send_message(msg)
    else:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORTA, timeout=20) as s:
            s.starttls(context=contexto)
            if config.SMTP_USUARIO:
                s.login(config.SMTP_USUARIO, config.SMTP_SENHA)
            s.send_message(msg)
    return True
