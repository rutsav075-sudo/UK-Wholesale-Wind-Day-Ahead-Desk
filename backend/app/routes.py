from fastapi import APIRouter, Query, HTTPException
from backend.app.analytics import (
    get_delivery_dates,
    get_day_ahead_data,
    calculate_metrics,
    get_month_summary,
    get_error_distribution,
    get_hourly_profile,
    get_forecast_evolution,
    simulate_thermal_procurement
)
from backend.app.fetcher import seed_january_2026, sync_actuals_range, sync_forecasts_range

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "elexon-wind-analytics"}

@router.get("/dates")
def list_dates():
    dates = get_delivery_dates()
    return {"dates": dates}

@router.get("/summary")
def summary(
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59)
):
    return get_month_summary(cutoff_hour, cutoff_minute)

@router.get("/day-ahead")
def day_ahead(
    date: str = Query(..., regex=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59)
):
    day_res = get_day_ahead_data(date, cutoff_hour, cutoff_minute)
    metrics = calculate_metrics(day_res["records"])
    return {
        **day_res,
        "metrics": metrics
    }

@router.get("/analytics/error-distribution")
def error_distribution(
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59)
):
    return get_error_distribution(cutoff_hour, cutoff_minute)

@router.get("/analytics/hourly-profile")
def hourly_profile(
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59)
):
    profile = get_hourly_profile(cutoff_hour, cutoff_minute)
    return {"profile": profile}

@router.get("/forecast-evolution")
def forecast_evolution(target_time: str = Query(...)):
    return get_forecast_evolution(target_time)

@router.get("/simulation/procurement")
def simulation(
    date: str = Query(..., regex=r"^\d{4}-\d{2}-\d{2}$"),
    base_demand: float = Query(28000.0, ge=1000.0),
    confidence_level: float = Query(0.90, ge=0.5, le=0.99),
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59)
):
    return simulate_thermal_procurement(
        delivery_date=date,
        base_demand_mw=base_demand,
        confidence_level=confidence_level,
        cutoff_hour=cutoff_hour,
        cutoff_minute=cutoff_minute
    )

@router.post("/sync")
def trigger_sync():
    res = seed_january_2026()
    return res
