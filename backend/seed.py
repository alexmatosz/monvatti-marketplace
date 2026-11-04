"""Cria o usuário inicial, como se já tivesse pago. Rode: python -m backend.seed

O login é só por e-mail (sem senha). Defina o e-mail antes de rodar:
    set MONVATTI_USUARIO_EMAIL=chefe@suaempresa.com.br   (Windows)
ou edite o padrão abaixo. Não duplica quem já existe. Quando a landing page e o
pagamento (AbacatePay) entrarem, é o cadastro pago que cria os usuários.
"""

import os

from backend.db import SessionLocal, init_db
from backend.models import Usuario


def main():
    init_db()
    email = os.getenv("MONVATTI_USUARIO_EMAIL", "alexmonvatti@gmail.com").strip().lower()
    nome = os.getenv("MONVATTI_USUARIO_NOME", "Monvatti")
    with SessionLocal() as db:
        if db.query(Usuario).filter(Usuario.email == email).first():
            print(f"Já existe: {email}")
            return
        db.add(Usuario(nome=nome, email=email, papel="admin", assinatura_ativa=True))
        db.commit()
    print(f"Usuário criado (assinatura ativa): {email}")
    print("Entre na extensão com esse e-mail. Para usar outro, defina MONVATTI_USUARIO_EMAIL e rode de novo.")


if __name__ == "__main__":
    main()
