import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timedelta, timezone

from app.db.session import SessionLocal
from app.models import Event, Seat, User
from app.services.security import hash_senha


def criar_usuario(db, nome, email, senha, role):
    if db.query(User).filter(User.email == email).first():
        return None
    usuario = User(nome=nome, email=email, senha_hash=hash_senha(senha), role=role)
    db.add(usuario)
    db.flush()
    return usuario


def main():
    db = SessionLocal()
    try:
        org = criar_usuario(db, "Organizador Verzel", "org@teste.com", "org123", "organizador")
        criar_usuario(db, "Ana Cliente", "ana@teste.com", "cliente123", "cliente")
        criar_usuario(db, "Bruno Cliente", "bruno@teste.com", "cliente123", "cliente")
        criar_usuario(db, "Portaria Cine", "portaria@teste.com", "portaria123", "portaria")

        if org is not None and not db.query(Event).filter(Event.titulo == "Duna: Parte Dois").first():
            evento = Event(
                organizador_id=org.id,
                tmdb_movie_id=693134,
                titulo="Duna: Parte Dois",
                sinopse="Paul Atreides une forças com Chani e os Fremen...",
                data=datetime.now(timezone.utc) + timedelta(days=7),
                local="Cine Elite — Sala 3",
                preco=45.90,
            )
            db.add(evento)
            db.flush()

            for letra in "ABCD":
                for numero in range(1, 9):
                    db.add(Seat(event_id=evento.id, fileira=letra, numero=numero, status="livre"))

        db.commit()
        print("Seed concluído!")
    finally:
        db.close()


if __name__ == "__main__":
    main()