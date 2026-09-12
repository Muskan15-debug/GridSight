from fastapi import APIRouter

from app.models.schemas import ReverseGeocodeRequest, ReverseGeocodeResponse
from app.services.geocoding_service import reverse_geocode

router = APIRouter(prefix="/api/v1/geocode", tags=["geocode"])


@router.post("/reverse", response_model=ReverseGeocodeResponse)
async def reverse_geocode_endpoint(payload: ReverseGeocodeRequest):
    display_name = await reverse_geocode(payload.lat, payload.lon)
    return ReverseGeocodeResponse(display_name=display_name)
