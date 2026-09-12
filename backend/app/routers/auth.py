from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.db import get_db
from app.models.schemas import LoginRequest, SignupRequest, TokenResponse, UserOut
from app.services.auth_service import authenticate_user, create_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await create_user(db, payload)
    token = create_access_token(user.id)
    return TokenResponse(token=token, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await authenticate_user(db, payload.email, payload.password)
    token = create_access_token(user.id)
    return TokenResponse(token=token, user=user)


@router.post("/logout")
async def logout():
    # JWTs are stateless — the client discards the token. Nothing to invalidate server-side yet.
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: UserOut = Depends(get_current_user)):
    return current_user
