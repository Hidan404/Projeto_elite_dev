from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservations.id"))
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    cliente_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    seat_id: Mapped[int] = mapped_column(ForeignKey("seats.id"))
    codigo: Mapped[str] = mapped_column(String(500), unique=True)
    status: Mapped[str] = mapped_column(String(10), default="ativo")
    share_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    reservation = relationship("Reservation", back_populates="tickets")
    validation = relationship("Validation", back_populates="ticket", uselist=False)