from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import  require_role
from app.db.session import get_db
from app.models import Event, Movie, Reservation, Seat, Ticket, User
from app.schemas.event import EventCreate, EventDetail, EventOut, SeatOut
from app.services.tmdb_client import buscar_detalhe_filme, buscar_filmes_em_cartaz, buscar_filme_por_texto
from app.schemas.event import EventUpdate



router = APIRouter(prefix="/events", tags=["events"])


def gerar_assentos(db: Session, evento: Event, fileiras: list[str], cadeiras_por_fileira: int):
    for letra in fileiras:
        for numero in range(1, cadeiras_por_fileira + 1):
            db.add(Seat(event_id=evento.id, fileira=letra, numero=numero, status="livre"))


def montar_evento_out(evento: Event) -> EventOut:
    return EventOut(
        id=evento.id,
        tmdb_movie_id=evento.tmdb_movie_id,
        titulo=evento.titulo,
        sinopse=evento.sinopse,
        data=evento.data,
        local=evento.local,
        preco=evento.preco,
        poster_path=evento.movie.poster_path if evento.movie else None,
        backdrop_path=evento.movie.backdrop_path if evento.movie else None,
    )


@router.get("", response_model=list[EventOut])
def listar_eventos(db: Session = Depends(get_db)):
    eventos = db.query(Event).options(selectinload(Event.movie)).order_by(Event.data).all()
    return [montar_evento_out(e) for e in eventos]


@router.get("/search-tmdb")
async def buscar_catalogo(query: str = ""):
    if query:
        filmes = await buscar_filme_por_texto(query)
    else:
        filmes = await buscar_filmes_em_cartaz()
    return [
        {"id": f["id"], "titulo": f.get("title"), "sinopse": f.get("overview"),
         "poster_path": f.get("poster_path"), "backdrop_path": f.get("backdrop_path")}
        for f in filmes
    ]


@router.get("/{event_id}", response_model=EventDetail)
def detalhe_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).options(selectinload(Event.seats), selectinload(Event.movie)).filter(Event.id == event_id).first()
    if evento is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento não encontrado")
    detalhe = montar_evento_out(evento).model_dump()
    detalhe["seats"] = evento.seats
    return detalhe


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def criar_evento(
    dados: EventCreate,
    db: Session = Depends(get_db),
    organizador: User = Depends(require_role("organizador")),
):
    filme = db.query(Movie).filter(Movie.tmdb_id == dados.tmdb_movie_id).first()
    if filme is None:
        detalhe = await buscar_detalhe_filme(dados.tmdb_movie_id)
        filme = Movie(
            tmdb_id=detalhe["id"],
            titulo=detalhe.get("title", "Sem título"),
            sinopse=detalhe.get("overview"),
            poster_path=detalhe.get("poster_path"),
            backdrop_path=detalhe.get("backdrop_path"),
        )
        db.add(filme)
        db.flush()

    evento = Event(
        organizador_id=organizador.id,
        tmdb_movie_id=dados.tmdb_movie_id,
        titulo=filme.titulo,
        sinopse=filme.sinopse,
        data=dados.data,
        local=dados.local,
        preco=dados.preco,
    )
    db.add(evento)
    db.flush()
    gerar_assentos(db, evento, ["A", "B", "C", "D"], 8)
    db.commit()
    db.refresh(evento)
    evento.movie = filme
    return montar_evento_out(evento)



@router.patch("/{event_id}", response_model=EventOut)
def editar_evento(
    event_id: int,
    dados: EventUpdate,
    db: Session = Depends(get_db),
    organizador: User = Depends(require_role("organizador")),
):
    evento = db.get(Event, event_id)
    if evento is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento não encontrado")
    if evento.organizador_id != organizador.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Você não é o organizador deste evento")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(evento, campo, valor)
    db.commit()
    db.refresh(evento)
    return montar_evento_out(evento)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_evento(
    event_id: int,
    db: Session = Depends(get_db),
    organizador: User = Depends(require_role("organizador")),
):
    evento = db.get(Event, event_id)
    if evento is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento não encontrado")
    if evento.organizador_id != organizador.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Você não é o organizador deste evento")

    tem_ingressos = db.query(Ticket).filter(Ticket.event_id == event_id).first()
    if tem_ingressos:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Evento possui ingressos vendidos. Não é possível cancelar.",
        )

    reservas = db.query(Reservation).filter(Reservation.event_id == event_id).all()
    for r in reservas:
        if r.status == "pendente":
            db.query(Seat).filter(Seat.reservation_id == r.id).update(
                {"status": "livre", "reservation_id": None}, synchronize_session=False
            )
            r.status = "cancelada"
    db.commit()

    db.delete(evento)
    db.commit()