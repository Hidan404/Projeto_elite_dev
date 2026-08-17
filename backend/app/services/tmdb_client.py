import httpx

from app.core.config import settings


async def buscar_filmes_em_cartaz():
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.TMDB_BASE_URL}/movie/now_playing",
            params={"api_key": settings.TMDB_API_KEY, "language": "pt-BR"},
        )
        resp.raise_for_status()
        return resp.json().get("results", [])


async def buscar_filme_por_texto(query: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.TMDB_BASE_URL}/search/movie",
            params={"api_key": settings.TMDB_API_KEY, "language": "pt-BR", "query": query},
        )
        resp.raise_for_status()
        return resp.json().get("results", [])


async def buscar_detalhe_filme(tmdb_id: int):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"api_key": settings.TMDB_API_KEY, "language": "pt-BR"},
        )
        resp.raise_for_status()
        return resp.json()