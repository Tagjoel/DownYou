
import os
import shutil
import tempfile
import subprocess
import httpx

from uuid import uuid4
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask


app = FastAPI(
    title="Download You API",
    description="API de reconnaissance et de conversion vidéo",
    version="1.0.0"
)


# Configuration CORS
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


# Configuration
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 Mo

ALLOWED_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".mkv",
    ".avi",
    ".webm",
    ".m4v"
}


# Route d'accueil
@app.get("/")
async def home():
    return {
        "message": "Bienvenue sur l'API Download You",
        "status": "online"
    }


# Reconnaissance des informations YouTube
@app.get("/api/video-info")
async def get_video_info(url: str):

    if not url:
        raise HTTPException(
            status_code=400,
            detail="Veuillez fournir un lien vidéo."
        )

    from urllib.parse import urlparse

    parsed_url = urlparse(url)
    hostname = (parsed_url.hostname or "").lower()

    allowed_hosts = {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be"
    }

    if hostname not in allowed_hosts:
        raise HTTPException(
            status_code=400,
            detail="Veuillez fournir un lien YouTube valide."
        )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://www.youtube.com/oembed",
                params={
                    "url": url,
                    "format": "json"
                }
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

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=404,
            detail="Impossible de récupérer les informations de cette vidéo."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Impossible de contacter YouTube pour le moment."
        )


# Conversion d'une vidéo importée par l'utilisateur
@app.post("/api/convert")
async def convert_video(
    file: UploadFile = File(...),
    output_format: str = Form(...)
):

    # Vérifier le format demandé
    output_format = output_format.lower().strip()

    if output_format not in ["mp4", "mp3"]:
        raise HTTPException(
            status_code=400,
            detail="Format non pris en charge. Choisissez MP4 ou MP3."
        )

    # Vérifier l'extension
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Ce type de fichier vidéo n'est pas accepté."
        )

    # Créer un dossier temporaire unique
    temp_dir = tempfile.mkdtemp(prefix="downyou_")

    input_path = os.path.join(
        temp_dir,
        f"input{extension}"
    )

    output_path = os.path.join(
        temp_dir,
        f"converted_{uuid4().hex}.{output_format}"
    )

    try:
        # Enregistrer le fichier envoyé par l'utilisateur
        file_size = 0

        with open(input_path, "wb") as destination:

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                file_size += len(chunk)

                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Le fichier dépasse la limite de 500 Mo."
                    )

                destination.write(chunk)

        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Le fichier envoyé est vide."
            )

        # Commande FFmpeg
        if output_format == "mp4":
            command = [
                "ffmpeg",
                "-y",
                "-i", input_path,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                output_path
            ]

        else:
            command = [
                "ffmpeg",
                "-y",
                "-i", input_path,
                "-vn",
                "-codec:a", "libmp3lame",
                "-b:a", "192k",
                output_path
            ]

        # Exécuter FFmpeg
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=1800
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=422,
                detail="La conversion a échoué. Vérifiez que votre fichier est valide."
            )

        if not os.path.exists(output_path):
            raise HTTPException(
                status_code=500,
                detail="Le fichier converti n'a pas été généré."
            )

        # Préparer le téléchargement
        download_name = (
            f"{Path(original_name).stem}.{output_format}"
        )

        media_type = (
            "video/mp4"
            if output_format == "mp4"
            else "audio/mpeg"
        )

        return FileResponse(
            path=output_path,
            media_type=media_type,
            filename=download_name,
            background=BackgroundTask(
                shutil.rmtree,
                temp_dir,
                ignore_errors=True
            )
        )

    except subprocess.TimeoutExpired:
        shutil.rmtree(temp_dir, ignore_errors=True)

        raise HTTPException(
            status_code=408,
            detail="La conversion a pris trop de temps."
        )

    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    finally:
        await file.close()
