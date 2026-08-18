import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_role
from app.db.session import get_db
from app.models import Event, Reservation, Seat, Ticket, User
from app.schemas.ingresso import TicketOut
from app.schemas.reserva import PagamentoRequest, ReservaCreate, ReservaOut
from app.services.ingresso import gerar_payload

router = APIRouter(tags=["reservas"])


def assento_str(assento: Seat) -> str:
    return f"{assento.fileira}{assento.numero}"


def montar_ticket_out(ticket: Ticket) -> TicketOut:
    return TicketOut(
        id=ticket.id,
        codigo=ticket.codigo,
        status=ticket.status,
        share_token=ticket.share_token,
        evento_titulo=ticket.event.titulo if ticket.event else "",
        assento=f"{ticket.seat.fileira}{ticket.seat.numero}" if ticket.seat else "",
    )


@router.post("/events/{event_id}/reserve", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def reservar(
    event_id: int,
    dados: ReservaCreate,
    db: Session = Depends(get_db),
    cliente: User = Depends(require_role("cliente")),
):
    evento = db.get(Event, event_id)
    if evento is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento não encontrado")

    assentos = db.query(Seat).filter(Seat.event_id == event_id, Seat.id.in_(dados.assentos)).all()
    if len(assentos) != len(set(dados.assentos)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Alguns assentos não existem neste evento")

    reserva = Reservation(event_id=event_id, cliente_id=cliente.id, status="pendente")
    db.add(reserva)
    db.flush()

    resultado = db.query(Seat).filter(
        Seat.id.in_(dados.assentos),
        Seat.status == "livre",
    ).update({"status": "reservado", "reservation_id": reserva.id}, synchronize_session=False)

    if resultado != len(set(dados.assentos)):
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Alguns assentos já foram reservados. Escolha outros.",
        )

    db.commit()
    db.refresh(reserva)
    return ReservaOut(
        id=reserva.id,
        event_id=reserva.event_id,
        status=reserva.status,
        assentos=[assento_str(a) for a in assentos],
    )


@router.post("/reservations/{reserva_id}/pay", response_model=list[TicketOut])
def pagar(
    reserva_id: int,
    dados: PagamentoRequest,
    db: Session = Depends(get_db),
    cliente: User = Depends(require_role("cliente")),
):
    reserva = db.get(Reservation, reserva_id)
    if reserva is None or reserva.cliente_id != cliente.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reserva não encontrada")
    if reserva.status != "pendente":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reserva já processada")

    assentos = db.query(Seat).filter(Seat.reservation_id == reserva.id).all()

    if not dados.numero_cartao.startswith("4242"):
        for a in assentos:
            a.status = "livre"
            a.reservation_id = None
        reserva.status = "cancelada"
        db.commit()
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "Pagamento recusado. Reserva cancelada.")

    tickets = []
    for a in assentos:
        share_token = secrets.token_urlsafe(32)
        codigo = gerar_payload(reserva.event_id, assento_str(a), cliente.id, share_token)
        ticket = Ticket(
            reservation_id=reserva.id,
            event_id=reserva.event_id,
            cliente_id=cliente.id,
            seat_id=a.id,
            codigo=codigo,
            share_token=share_token,
            status="ativo",
        )
        db.add(ticket)
        a.status = "vendido"
        tickets.append(ticket)

    reserva.status = "paga"
    db.commit()

    tickets = (
        db.query(Ticket)
        .options(selectinload(Ticket.event), selectinload(Ticket.seat))
        .filter(Ticket.reservation_id == reserva.id)
        .all()
    )
    return [montar_ticket_out(t) for t in tickets]