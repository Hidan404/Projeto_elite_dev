from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models import Event, Seat, Ticket, User
from app.schemas.ingresso import TicketOut

router = APIRouter(prefix="/tickets", tags=["tickets"])


def montar_ticket_out(ticket: Ticket) -> TicketOut:
    evento = ticket.event
    assento = ticket.seat
    return TicketOut(
        id=ticket.id,
        codigo=ticket.codigo,
        status=ticket.status,
        share_token=ticket.share_token,
        evento_titulo=evento.titulo if evento else "",
        assento=f"{assento.fileira}{assento.numero}" if assento else "",
    )


@router.get("/mine", response_model=list[TicketOut])
def meus_ingressos(
    db: Session = Depends(get_db),
    cliente: User = Depends(require_role("cliente")),
):
    tickets = (
        db.query(Ticket)
        .options(selectinload(Ticket.event), selectinload(Ticket.seat))
        .filter(Ticket.cliente_id == cliente.id)
        .all()
    )
    return [montar_ticket_out(t) for t in tickets]