from pydantic import BaseModel


class ReservaCreate(BaseModel):
    assentos: list[int]


class ReservaOut(BaseModel):
    id: int
    event_id: int
    status: str
    assentos: list[str]

    class Config:
        from_attributes = True


class PagamentoRequest(BaseModel):
    numero_cartao: str
    validade: str
    cvv: str

