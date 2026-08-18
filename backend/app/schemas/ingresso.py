from pydantic import BaseModel


class TicketOut(BaseModel):
    id: int
    codigo: str
    status: str
    share_token: str
    evento_titulo: str
    assento: str

    class Config:
        from_attributes = True


class ValidacaoRequest(BaseModel):
    codigo: str
    evento_id: int | None = None


class ValidacaoResult(BaseModel):
    status: str
    mensagem: str