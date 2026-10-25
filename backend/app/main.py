from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import cards, topics

app = FastAPI(title="LearningApp API", version="0.1.0")

# El frontend normalmente llama vía el proxy de Next.js (/api/*), pero dejamos
# CORS abierto a localhost:3000 por si se llama a la API directamente.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics.router)
app.include_router(cards.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
