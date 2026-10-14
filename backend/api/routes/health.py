from fastapi import APIRouter

from app.db.mongodb import get_database

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    database = get_database()
    await database.command("ping")

    return {
        "status": "ok",
        "database": "connected"
    }