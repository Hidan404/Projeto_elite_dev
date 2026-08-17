from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    TMDB_API_KEY: str
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"

    class Config:
        env_file = ".env"


settings = Settings()