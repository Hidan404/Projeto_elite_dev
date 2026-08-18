from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Seat(Base):
    __tablename__ = "seats"
    __table_args__ = (UniqueConstraint("event_id", "fileira", "numero"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    fileira: Mapped[str] = mapped_column(String(2))
    numero: Mapped[int]
    status: Mapped[str] = mapped_column(String(10), default="livre")
    reservation_id: Mapped[int | None] = mapped_column(ForeignKey("reservations.id"), nullable=True)

    event = relationship("Event", back_populates="seats")