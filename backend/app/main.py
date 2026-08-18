from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, events, portaria, reservas, tickets
from app.core.config import _split_origins, settings

app = FastAPI(title="Elite Dev — Eventos e Ingressos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_split_origins(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(reservas.router)
app.include_router(tickets.router)
app.include_router(portaria.router)


@app.get("/")
def root():
    return {"mensagem": "API Elite Dev rodando"}





