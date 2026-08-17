from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    tmdb_movie_id: int
    data: datetime
    local: str
    preco: Decimal = Field(gt=0, examples=[45.90])


class SeatOut(BaseModel):
    id: int
    fileira: str
    numero: int
    status: str

    class Config:
        from_attributes = True


class EventOut(BaseModel):
    id: int
    tmdb_movie_id: int
    titulo: str
    sinopse: str | None
    data: datetime
    local: str
    preco: Decimal
    poster_path: str | None = None

    class Config:
        from_attributes = True


class EventDetail(EventOut):
    seats: list[SeatOut] = []