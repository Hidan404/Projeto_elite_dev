from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models import Ticket, User, Validation
from app.schemas.ingresso import ValidacaoRequest, ValidacaoResult
from app.services.ingresso import verificar_codigo

router = APIRouter(prefix="/portaria", tags=["portaria"])


@router.post("/validate", response_model=ValidacaoResult)
def validar_ingresso(
    dados: ValidacaoRequest,
    db: Session = Depends(get_db),
    portaria: User = Depends(require_role("portaria")),
):
    payload = verificar_codigo(dados.codigo)
    if payload is None:
        return ValidacaoResult(status="invalido", mensagem="Código inválido ou forjado")

    ticket = db.query(Ticket).filter(Ticket.share_token == payload["share_token"]).first()
    if ticket is None:
        return ValidacaoResult(status="invalido", mensagem="Ingresso não encontrado no sistema")

    if ticket.status == "utilizado":
        return ValidacaoResult(status="ja_utilizado", mensagem="Este ingresso já foi utilizado")

    if dados.evento_id is not None and ticket.event_id != dados.evento_id:
        return ValidacaoResult(status="evento_errado", mensagem="Ingresso de outro evento")

    ticket.status = "utilizado"
    db.add(Validation(ticket_id=ticket.id, resultado="valido"))
    db.commit()

    return ValidacaoResult(status="valido", mensagem="Ingresso válido. Bom evento!")