import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timedelta, timezone

from app.db.session import SessionLocal
from app.models import Event, Movie, Seat, User
from app.services.security import hash_senha
from app.services.tmdb_client import buscar_detalhe_filme, buscar_filmes_em_cartaz


def criar_usuario(db, nome, email, senha, role):
    if db.query(User).filter(User.email == email).first():
        return None
    usuario = User(nome=nome, email=email, senha_hash=hash_senha(senha), role=role)
    db.add(usuario)
    db.flush()
    return usuario


def obter_movie(db, tmdb_id):
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if movie:
        return movie
    detalhe = asyncio.run(buscar_detalhe_filme(tmdb_id))
    movie = Movie(
        tmdb_id=tmdb_id,
        titulo=detalhe.get("title", "Sem título"),
        sinopse=detalhe.get("overview"),
        poster_path=detalhe.get("poster_path"),
        backdrop_path=detalhe.get("backdrop_path"),
    )
    db.add(movie)
    db.flush()
    return movie


def criar_evento(db, org, tmdb_id, dias, local, preco):
    evento = db.query(Event).filter(Event.tmdb_movie_id == tmdb_id).first()
    if evento is not None:
        if evento.movie is None:
            obter_movie(db, tmdb_id)
            print(f"Backfill de pôster para evento existente: {evento.titulo}")
        return evento

    movie = obter_movie(db, tmdb_id)
    evento = Event(
        organizador_id=org.id,
        tmdb_movie_id=tmdb_id,
        titulo=movie.titulo,
        sinopse=movie.sinopse,
        data=datetime.now(timezone.utc) + timedelta(days=dias),
        local=local,
        preco=preco,
    )
    db.add(evento)
    db.flush()

    for letra in "ABCD":
        for numero in range(1, 9):
            db.add(Seat(event_id=evento.id, fileira=letra, numero=numero, status="livre"))

    print(f"Evento criado: {evento.titulo} — {evento.local}")
    return evento


def main():
    db = SessionLocal()
    try:
        criar_usuario(db, "Organizador Verzel", "org@teste.com", "org123", "organizador")
        criar_usuario(db, "Ana Cliente", "ana@teste.com", "cliente123", "cliente")
        criar_usuario(db, "Bruno Cliente", "bruno@teste.com", "cliente123", "cliente")
        criar_usuario(db, "Portaria Cine", "portaria@teste.com", "portaria123", "portaria")

        org = db.query(User).filter(User.email == "org@teste.com").first()
        if org is None:
            print("Organizador não encontrado. Abortando seed.")
            return

        criar_evento(db, org, 693134, 7, "Cine Elite — Sala 3", 45.90)
        criar_evento(db, org, 533535, 4, "Cine Elite — Sala 1", 39.90)

        em_cartaz = asyncio.run(buscar_filmes_em_cartaz())
        adicionados = 0
        for filme in em_cartaz:
            if adicionados >= 3:
                break
            tmdb_id = filme["id"]
            if db.query(Event).filter(Event.tmdb_movie_id == tmdb_id).first():
                continue
            if not filme.get("poster_path"):
                continue
            criar_evento(
                db,
                org,
                tmdb_id,
                10 + adicionados * 3,
                f"Cine Elite — Sala {adicionados + 2}",
                39.90 + adicionados * 5,
            )
            adicionados += 1

        db.commit()
        print(f"Seed concluído! ({adicionados} eventos em cartaz adicionados)")
    finally:
        db.close()


if __name__ == "__main__":
    main()