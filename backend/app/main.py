from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import close_mongo_connection, connect_to_mongo, get_db
from app.routers import auth, demand, forecast, geocode, history, storage, users, weather
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    start_scheduler(get_db())
    yield
    stop_scheduler()
    await close_mongo_connection()


app = FastAPI(title="GridSight API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(weather.router)
app.include_router(forecast.router)
app.include_router(demand.router)
app.include_router(storage.router)
app.include_router(history.router)
app.include_router(geocode.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
