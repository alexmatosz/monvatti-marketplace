"""Senha (PBKDF2, sem dependência externa) e token de sessão assinado (HMAC).

O token carrega o id do usuário, a versão da sessão e o vencimento; é assinado
com MONVATTI_SECRET. Trocar a senha ou desligar o acesso sobe sessao_versao e
invalida os tokens antigos.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

from backend import config

_ITERACOES = 200_000


def hash_senha(senha: str) -> str:
    sal = secrets.token_bytes(16)
    derivada = hashlib.pbkdf2_hmac("sha256", senha.encode(), sal, _ITERACOES)
    return f"pbkdf2${_ITERACOES}${sal.hex()}${derivada.hex()}"


def conferir_senha(senha: str, guardada: str) -> bool:
    try:
        _, iteracoes, sal_hex, esperado_hex = guardada.split("$")
        derivada = hashlib.pbkdf2_hmac("sha256", senha.encode(), bytes.fromhex(sal_hex), int(iteracoes))
        return hmac.compare_digest(derivada.hex(), esperado_hex)
    except (ValueError, TypeError):
        return False


def _b64(dados: bytes) -> str:
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()


def _db64(texto: str) -> bytes:
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


def _assinar(corpo: str) -> str:
    return _b64(hmac.new(config.SECRET.encode(), corpo.encode(), hashlib.sha256).digest())


def criar_token(usuario_id: int, sessao_versao: int) -> str:
    vence = int(time.time()) + config.TOKEN_VALIDADE_DIAS * 86400
    corpo = _b64(json.dumps({"u": usuario_id, "v": sessao_versao, "exp": vence}).encode())
    return f"{corpo}.{_assinar(corpo)}"


def criar_state_ml(usuario_id: int) -> str:
    """State do OAuth do ML que carrega, assinado, quem está conectando. O
    callback do Mercado Livre não traz o token da sessão, então é por aqui que
    o servidor sabe de quem é a conta que voltou."""
    corpo = f"{usuario_id}.{secrets.token_urlsafe(6)}"
    return f"{corpo}.{_assinar(corpo)}"


def ler_state_ml(state: str) -> int | None:
    try:
        uid, nonce, assinatura = (state or "").split(".", 2)
    except ValueError:
        return None
    if not hmac.compare_digest(assinatura, _assinar(f"{uid}.{nonce}")):
        return None
    try:
        return int(uid)
    except ValueError:
        return None


def pkce_do_state(state: str) -> tuple[str, str]:
    """PKCE sem guardar nada: o code_verifier sai do state, então o callback do
    Mercado Livre (em qualquer servidor) recalcula o mesmo valor."""
    verificador = _b64(hmac.new(config.SECRET.encode(), f"pkce|{state}".encode(), hashlib.sha256).digest())
    desafio = _b64(hashlib.sha256(verificador.encode()).digest())
    return verificador, desafio


def ler_token(token: str) -> dict | None:
    try:
        corpo, assinatura = token.split(".", 1)
    except (ValueError, AttributeError):
        return None
    if not hmac.compare_digest(assinatura, _assinar(corpo)):
        return None
    try:
        dados = json.loads(_db64(corpo))
    except (ValueError, TypeError):
        return None
    if dados.get("exp", 0) < time.time():
        return None
    return dados
