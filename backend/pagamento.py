"""Encaixe de pagamento (AbacatePay) — por ora um stub.

A ideia: hoje o login já funciona e todo usuário entra com assinatura_ativa=True.
Quando a landing page e o AbacatePay entrarem, nada aqui muda de forma:
- `assinatura_valida` continua sendo a única pergunta que o resto do sistema faz;
- `registrar_evento_abacatepay` recebe o webhook do AbacatePay (pagamento
  confirmado, assinatura vencida) e liga/desliga `assinatura_ativa` do usuário.

Assim o resto do código não sabe (nem precisa saber) como o pagamento é feito.
"""

from datetime import datetime, timezone

from backend.models import Usuario


def assinatura_valida(usuario: Usuario) -> bool:
    """Único ponto que decide se o usuário pode usar o estudo."""
    if not usuario.assinatura_ativa:
        return False
    if usuario.assinatura_ate and usuario.assinatura_ate < datetime.now(timezone.utc):
        return False
    return True


def registrar_evento_abacatepay(db, evento: dict) -> None:
    """Ponto de entrada do webhook do AbacatePay (a implementar).

    Aqui dentro, ao receber "pagamento confirmado", achar o usuário pelo e-mail/id
    do evento e definir assinatura_ativa=True e assinatura_ate = próxima cobrança.
    Ao receber "assinatura cancelada/vencida", definir assinatura_ativa=False.
    """
    raise NotImplementedError("Integração com o AbacatePay ainda não implementada.")
