from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioCreate, UsuarioOut
from app.services.security import criar_token, hash_senha, verificar_hash

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"


def set_token_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,  # True em produção (HTTPS)
        samesite="lax",
        max_age=60 * 60,  # 1h, alinhado ao JWT
        path="/",
    )


@router.post("/register", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def register(dados: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == dados.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email já cadastrado")

    usuario = User(
        nome=dados.nome,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        role="cliente",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginRequest, response: Response, db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.email == dados.email).first()
    if usuario is None or not verificar_hash(dados.senha, usuario.senha_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas")

    token = criar_token(usuario.id, usuario.role)
    set_token_cookie(response, token)
    return TokenResponse(access_token=token, role=usuario.role)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UsuarioOut)
def me(user: User = Depends(get_current_user)):
    return user