
from fastapi import FastAPI

app = FastAPI(
    title="MindSense Backend",
    version="0.1.0",
    description="Backend foundation for the MindSense project.",
)


@app.get("/")
async def root():
    return {"message": "MindSense backend is running"}


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "database": "not_connected"
    }
