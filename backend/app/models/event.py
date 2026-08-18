from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organizador_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    tmdb_movie_id: Mapped[int]
    titulo: Mapped[str] = mapped_column(String(200))
    sinopse: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    local: Mapped[str] = mapped_column(String(200))
    preco: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


    seats = relationship("Seat", back_populates="event", cascade="all, delete-orphan")
    movie = relationship(
        "Movie",
        primaryjoin="Event.tmdb_movie_id == Movie.tmdb_id",
        foreign_keys="Event.tmdb_movie_id",
        uselist=False,
    )