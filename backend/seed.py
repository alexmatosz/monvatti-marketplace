"""Cria os primeiros acessos. Rode uma vez: python -m backend.seed

Usa variáveis de ambiente se existirem, senão gera uma senha aleatória e a
mostra na tela (só desta vez). Não duplica quem já existe.
"""

import os
import secrets

from backend.db import SessionLocal, init_db
from backend.models import Usuario
from backend.security import hash_senha


def _criar(db, nome: str, email: str, senha: str, papel: str) -> tuple[str, str] | None:
    email = email.lower()
    if db.query(Usuario).filter(Usuario.email == email).first():
        print(f"  já existe: {email}")
        return None
    db.add(Usuario(nome=nome, email=email, senha_hash=hash_senha(senha), papel=papel))
    db.commit()
    return email, senha


def main():
    init_db()
    contas = [
        ("Administrador", os.getenv("MONVATTI_ADMIN_EMAIL", "admin@monvatti.com.br"),
         os.getenv("MONVATTI_ADMIN_SENHA", secrets.token_urlsafe(9)), "admin"),
        ("Chefe", os.getenv("MONVATTI_CHEFE_EMAIL", "chefe@monvatti.com.br"),
         os.getenv("MONVATTI_CHEFE_SENHA", secrets.token_urlsafe(9)), "equipe"),
    ]
    with SessionLocal() as db:
        print("Criando acessos iniciais:")
        for nome, email, senha, papel in contas:
            criado = _criar(db, nome, email, senha, papel)
            if criado:
                print(f"  {papel}: {criado[0]}  senha: {criado[1]}")
    print("\nGuarde essas senhas. Para trocar, apague o banco (pasta dados/) e rode de novo,\n"
          "ou defina MONVATTI_ADMIN_SENHA / MONVATTI_CHEFE_SENHA antes de rodar.")


if __name__ == "__main__":
    main()
