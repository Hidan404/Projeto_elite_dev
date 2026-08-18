import hashlib
import hmac
import json

from app.core.config import settings


def gerar_payload(event_id: int, assento: str, cliente_id: int, share_token: str) -> str:
    dados = {"event_id": event_id, "assento": assento, "cliente_id": cliente_id, "share_token": share_token}
    payload = json.dumps(dados, separators=(",", ":"), sort_keys=True)
    assinatura = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}.{assinatura}"


def verificar_codigo(codigo: str) -> dict | None:
    try:
        payload, assinatura = codigo.rsplit(".", 1)
        esperada = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(assinatura, esperada):
            return None
        return json.loads(payload)
    except (ValueError, json.JSONDecodeError):
        return None
