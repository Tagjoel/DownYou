
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import httpx

app = FastAPI(
    title="Download You API",
    description="API du projet Download You",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be"
}


def validate_youtube_url(value: str):
    parsed = urlparse(value)

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400,
            detail="Le lien doit commencer par http ou https."
        )

    if parsed.hostname not in ALLOWED_HOSTS:
        raise HTTPException(
            status_code=400,
            detail="Seuls les liens YouTube sont acceptés."
        )

    if parsed.username or parsed.password:
        raise HTTPException(
            status_code=400,
            detail="Lien invalide."
        )


@app.get("/")
async def home():
    return {
        "message": "Bienvenue sur l'API Download You",
        "status": "online"
    }


@app.get("/api/video-info")
async def get_video_info(
    url: str = Query(..., min_length=10, max_length=2048)
):
    validate_youtube_url(url)

    oembed_url = "https://www.youtube.com/oembed"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                oembed_url,
                params={
                    "url": url,
                    "format": "json"
                }
            )

        if response.status_code in (401, 403, 404):
            raise HTTPException(
                status_code=404,
                detail="Vidéo introuvable, privée ou non disponible."
            )

        response.raise_for_status()
        data = response.json()

        return {
            "title": data.get("title"),
            "author": data.get("author_name"),
            "thumbnail": data.get("thumbnail_url"),
            "provider": data.get("provider_name"),
            "video_url": url
        }

    except HTTPException:
        raise

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Impossible de récupérer les informations de cette vidéo."
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="La réponse reçue de YouTube est invalide."
        )
