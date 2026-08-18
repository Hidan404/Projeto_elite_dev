from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, events, portaria, reservas, tickets

app = FastAPI(title="Elite Dev — Eventos e Ingressos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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





