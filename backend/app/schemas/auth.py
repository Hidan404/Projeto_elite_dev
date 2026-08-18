from pydantic import BaseModel, EmailStr, Field


class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=80)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=72)


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str