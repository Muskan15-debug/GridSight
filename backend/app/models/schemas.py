from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    panel_area_sqm: float = Field(gt=0)
    panel_capacity_kw: float = Field(gt=0)
    address: str
    daily_demand_kwh: float = Field(gt=0)
    storage_capacity_kwh: float = Field(ge=0)
    current_charge_kwh: float = Field(ge=0)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PanelOut(BaseModel):
    area_sqm: float
    capacity_kw: float


class LocationOut(BaseModel):
    lat: float
    lon: float
    display_name: str
    timezone: str | None = None


class DemandOut(BaseModel):
    default_daily_kwh: float
    last_updated: str


class StorageOut(BaseModel):
    capacity_kwh: float
    current_charge_kwh: float
    last_updated: str


class NotificationPrefsOut(BaseModel):
    email: bool = True
    push: bool = True


class UserOut(BaseModel):
    id: str
    email: EmailStr
    created_at: str
    panel: PanelOut
    location: LocationOut
    demand: DemandOut
    storage: StorageOut
    notification_prefs: NotificationPrefsOut


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class UpdateDemandRequest(BaseModel):
    demand_kwh: float = Field(gt=0)


class UpdateStorageRequest(BaseModel):
    storage_capacity_kwh: float = Field(ge=0)
    current_charge_kwh: float = Field(ge=0)


class RepredictRequest(BaseModel):
    demand_kwh: float = Field(gt=0)
    storage_capacity_kwh: float = Field(ge=0)
    current_charge_kwh: float = Field(ge=0)


class UpdateProfileRequest(BaseModel):
    panel_area_sqm: float | None = Field(default=None, gt=0)
    panel_capacity_kw: float | None = Field(default=None, gt=0)
    address: str | None = None
    notification_email: bool | None = None
    notification_push: bool | None = None


# class AlertRuleCreate(BaseModel):
#     threshold_kw: float = Field(ge=0)
#     comparison: Literal["below", "above"] = "below"
#     enabled: bool = True


# class AlertRuleOut(BaseModel):
#     id: str
#     threshold_kw: float
#     comparison: str
#     enabled: bool
#     created_at: str


# class AlertLogEntryOut(BaseModel):
#     id: str
#     type: Literal["threshold", "anomaly"]
#     rule_id: str | None = None
#     anomaly_type: str | None = None
#     severity: str
#     title: str
#     message: str
#     hour: str | None = None
#     forecast_id: str | None = None
#     triggered_at: str
