import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.app.db import get_connection

def get_delivery_dates():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT settlement_date 
        FROM actuals 
        WHERE settlement_date LIKE '2026-01%'
        ORDER BY settlement_date ASC
    """)
    rows = cur.fetchall()
    conn.close()
    return [r[0] for r in rows]

def get_day_ahead_data(delivery_date: str, cutoff_hour: int = 11, cutoff_minute: int = 0):
    delivery_dt = datetime.strptime(delivery_date, "%Y-%m-%d")
    decision_date = (delivery_dt - timedelta(days=1)).strftime("%Y-%m-%d")
    cutoff_iso = f"{decision_date}T{cutoff_hour:02d}:{cutoff_minute:02d}:00Z"

    next_date = (delivery_dt + timedelta(days=1)).strftime("%Y-%m-%d")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT start_time, settlement_period, generation 
        FROM actuals 
        WHERE settlement_date = ?
        ORDER BY settlement_period ASC
    """, (delivery_date,))
    actual_rows = cur.fetchall()

    cur.execute("""
        SELECT publish_time, start_time, generation
        FROM forecasts
        WHERE start_time >= ? AND start_time < ?
        ORDER BY publish_time ASC
    """, (f"{delivery_date}T00:00:00Z", f"{next_date}T00:00:00Z"))
    fc_rows = cur.fetchall()
    conn.close()

    da_fc_map = {}
    latest_fc_map = {}

    for row in fc_rows:
        pub = row["publish_time"]
        st = row["start_time"]
        gen = row["generation"]

        if pub <= cutoff_iso:
            if st not in da_fc_map or pub > da_fc_map[st]["publish_time"]:
                da_fc_map[st] = {"publish_time": pub, "generation": gen}

        if pub <= st:
            if st not in latest_fc_map or pub > latest_fc_map[st]["publish_time"]:
                latest_fc_map[st] = {"publish_time": pub, "generation": gen}

    matched_records = []
    for act in actual_rows:
        st = act["start_time"]
        sp = act["settlement_period"]
        act_gen = act["generation"]

        hourly_st = f"{st[:13]}:00:00Z"
        da_entry = da_fc_map.get(st) or da_fc_map.get(hourly_st)
        latest_entry = latest_fc_map.get(st) or latest_fc_map.get(hourly_st)

        da_gen = da_entry["generation"] if da_entry else None
        latest_gen = latest_entry["generation"] if latest_entry else None

        error = None
        abs_error = None
        pct_error = None

        if da_gen is not None:
            error = round(da_gen - act_gen, 2)
            abs_error = round(abs(da_gen - act_gen), 2)
            if act_gen > 10:
                pct_error = round((abs_error / act_gen) * 100, 2)

        matched_records.append({
            "startTime": st,
            "settlementPeriod": sp,
            "actualMW": round(act_gen, 2),
            "dayAheadForecastMW": round(da_gen, 2) if da_gen is not None else None,
            "latestForecastMW": round(latest_gen, 2) if latest_gen is not None else None,
            "errorMW": error,
            "absErrorMW": abs_error,
            "pctError": pct_error,
            "daPublishTime": da_entry["publish_time"] if da_entry else None
        })

    return {
        "deliveryDate": delivery_date,
        "decisionDate": decision_date,
        "cutoffTime": cutoff_iso,
        "records": matched_records
    }

def calculate_metrics(records):
    valid = [r for r in records if r["dayAheadForecastMW"] is not None and r["actualMW"] is not None]
    if not valid:
        return {
            "totalCount": 0,
            "mae": 0,
            "rmse": 0,
            "mape": 0,
            "wape": 0,
            "bias": 0,
            "correlation": 0,
            "avgActual": 0,
            "avgForecast": 0,
            "maxOverForecast": 0,
            "maxUnderForecast": 0,
            "overForecastRatio": 0,
            "percentiles": {"p10": 0, "p25": 0, "p50": 0, "p75": 0, "p90": 0}
        }

    actuals = np.array([r["actualMW"] for r in valid])
    forecasts = np.array([r["dayAheadForecastMW"] for r in valid])
    errors = forecasts - actuals
    abs_errors = np.abs(errors)

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    bias = float(np.mean(errors))

    sum_actual = float(np.sum(actuals))
    wape = float((np.sum(abs_errors) / sum_actual * 100)) if sum_actual > 0 else 0

    mask = actuals > 50
    mape = float(np.mean(abs_errors[mask] / actuals[mask] * 100)) if np.any(mask) else 0

    corr = 0
    if len(actuals) > 1 and np.std(actuals) > 0 and np.std(forecasts) > 0:
        corr_val = np.corrcoef(actuals, forecasts)[0, 1]
        corr = float(corr_val) if not np.isnan(corr_val) else 0

    over_count = int(np.sum(errors > 0))
    under_count = int(np.sum(errors < 0))
    total_count = len(errors)

    p10, p25, p50, p75, p90 = [float(x) for x in np.percentile(errors, [10, 25, 50, 75, 90])]

    return {
        "totalCount": total_count,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "wape": round(wape, 2),
        "bias": round(bias, 2),
        "correlation": round(corr, 4),
        "avgActual": round(float(np.mean(actuals)), 2),
        "avgForecast": round(float(np.mean(forecasts)), 2),
        "maxOverForecast": round(float(np.max(errors)), 2),
        "maxUnderForecast": round(float(np.min(errors)), 2),
        "overForecastRatio": round((over_count / total_count) * 100, 1),
        "underForecastRatio": round((under_count / total_count) * 100, 1),
        "percentiles": {
            "p10": round(p10, 2),
            "p25": round(p25, 2),
            "p50": round(p50, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2)
        }
    }

def get_month_summary(cutoff_hour: int = 11, cutoff_minute: int = 0):
    dates = get_delivery_dates()
    all_records = []
    daily_stats = []

    for d in dates:
        day_res = get_day_ahead_data(d, cutoff_hour, cutoff_minute)
        records = day_res["records"]
        all_records.extend(records)
        day_metrics = calculate_metrics(records)
        day_metrics["date"] = d
        daily_stats.append(day_metrics)

    monthly_metrics = calculate_metrics(all_records)
    return {
        "overall": monthly_metrics,
        "daily": daily_stats,
        "totalDates": len(dates)
    }

def get_error_distribution(cutoff_hour: int = 11, cutoff_minute: int = 0):
    dates = get_delivery_dates()
    all_errors = []

    for d in dates:
        day_res = get_day_ahead_data(d, cutoff_hour, cutoff_minute)
        for r in day_res["records"]:
            if r["errorMW"] is not None:
                all_errors.append(r["errorMW"])

    if not all_errors:
        return {"bins": [], "statistics": {}}

    arr = np.array(all_errors)
    min_val = math.floor(np.min(arr) / 500) * 500
    max_val = math.ceil(np.max(arr) / 500) * 500

    bins = list(range(int(min_val), int(max_val) + 500, 500))
    counts, edges = np.histogram(arr, bins=bins)

    histogram_data = []
    for i in range(len(counts)):
        histogram_data.append({
            "range": f"{edges[i]} to {edges[i+1]} MW",
            "binStart": int(edges[i]),
            "binEnd": int(edges[i+1]),
            "count": int(counts[i]),
            "percentage": round(float(counts[i] / len(arr) * 100), 2)
        })

    return {
        "histogram": histogram_data,
        "statistics": {
            "sampleCount": len(arr),
            "mean": round(float(np.mean(arr)), 2),
            "stdDev": round(float(np.std(arr)), 2),
            "p05": round(float(np.percentile(arr, 5)), 2),
            "p10": round(float(np.percentile(arr, 10)), 2),
            "p50": round(float(np.median(arr)), 2),
            "p90": round(float(np.percentile(arr, 90)), 2),
            "p95": round(float(np.percentile(arr, 95)), 2)
        }
    }

def get_hourly_profile(cutoff_hour: int = 11, cutoff_minute: int = 0):
    dates = get_delivery_dates()
    hour_buckets = {h: {"actuals": [], "forecasts": [], "errors": []} for h in range(24)}

    for d in dates:
        day_res = get_day_ahead_data(d, cutoff_hour, cutoff_minute)
        for r in day_res["records"]:
            if r["dayAheadForecastMW"] is not None and r["actualMW"] is not None:
                h = int(r["startTime"][11:13])
                hour_buckets[h]["actuals"].append(r["actualMW"])
                hour_buckets[h]["forecasts"].append(r["dayAheadForecastMW"])
                hour_buckets[h]["errors"].append(r["errorMW"])

    results = []
    for h in range(24):
        acts = hour_buckets[h]["actuals"]
        fcs = hour_buckets[h]["forecasts"]
        errs = hour_buckets[h]["errors"]

        if acts:
            abs_errs = [abs(e) for e in errs]
            results.append({
                "hour": h,
                "label": f"{h:02d}:00",
                "avgActualMW": round(float(np.mean(acts)), 2),
                "avgForecastMW": round(float(np.mean(fcs)), 2),
                "avgErrorMW": round(float(np.mean(errs)), 2),
                "maeMW": round(float(np.mean(abs_errs)), 2),
                "rmseMW": round(float(np.sqrt(np.mean(np.array(errs) ** 2))), 2)
            })
        else:
            results.append({
                "hour": h,
                "label": f"{h:02d}:00",
                "avgActualMW": 0,
                "avgForecastMW": 0,
                "avgErrorMW": 0,
                "maeMW": 0,
                "rmseMW": 0
            })

    return results

def get_forecast_evolution(target_time: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT generation FROM actuals WHERE start_time = ?", (target_time,))
    act_row = cur.fetchone()
    actual_gen = act_row["generation"] if act_row else None

    cur.execute("""
        SELECT publish_time, generation
        FROM forecasts
        WHERE start_time = ?
        ORDER BY publish_time ASC
    """, (target_time,))
    rows = cur.fetchall()
    conn.close()

    history = []
    target_dt = datetime.strptime(target_time, "%Y-%m-%dT%H:%M:%SZ")

    for r in rows:
        pub_dt = datetime.strptime(r["publish_time"], "%Y-%m-%dT%H:%M:%SZ")
        lead_hours = round((target_dt - pub_dt).total_seconds() / 3600, 1)
        err = round(r["generation"] - actual_gen, 2) if actual_gen is not None else None
        history.append({
            "publishTime": r["publish_time"],
            "forecastMW": round(r["generation"], 2),
            "leadHoursAhead": lead_hours,
            "errorMW": err
        })

    return {
        "targetTime": target_time,
        "actualMW": round(actual_gen, 2) if actual_gen is not None else None,
        "evolution": history
    }

def simulate_thermal_procurement(
    delivery_date: str,
    base_demand_mw: float = 28000.0,
    confidence_level: float = 0.90,
    cutoff_hour: int = 11,
    cutoff_minute: int = 0
):
    day_res = get_day_ahead_data(delivery_date, cutoff_hour, cutoff_minute)
    records = day_res["records"]
    all_dist = get_error_distribution(cutoff_hour, cutoff_minute)
    stats = all_dist.get("statistics", {})

    if confidence_level >= 0.95:
        buffer_mw = max(0.0, float(stats.get("p95", 2500.0)))
    elif confidence_level >= 0.90:
        buffer_mw = max(0.0, float(stats.get("p90", 2000.0)))
    elif confidence_level >= 0.75:
        buffer_mw = max(0.0, float(stats.get("p75", 1200.0)))
    else:
        buffer_mw = max(0.0, float(stats.get("p50", 500.0)))

    simulated = []
    for r in records:
        sp = r["settlementPeriod"]
        time_str = r["startTime"]
        act_wind = r["actualMW"]
        fc_wind = r["dayAheadForecastMW"] or 0

        demand = base_demand_mw * (0.8 + 0.35 * math.sin((sp - 14) / 48 * 2 * math.pi))
        demand = round(demand, 2)

        base_thermal = max(0.0, round(demand - fc_wind, 2))
        hedged_thermal = round(base_thermal + buffer_mw, 2)

        actual_residual_demand = max(0.0, round(demand - act_wind, 2))
        unhedged_imbalance = round(base_thermal - actual_residual_demand, 2)
        hedged_imbalance = round(hedged_thermal - actual_residual_demand, 2)

        simulated.append({
            "startTime": time_str,
            "settlementPeriod": sp,
            "demandMW": demand,
            "windForecastMW": fc_wind,
            "actualWindMW": act_wind,
            "baseThermalProcuredMW": base_thermal,
            "bufferMW": round(buffer_mw, 2),
            "hedgedThermalProcuredMW": hedged_thermal,
            "actualResidualDemandMW": actual_residual_demand,
            "unhedgedImbalanceMW": unhedged_imbalance,
            "hedgedImbalanceMW": hedged_imbalance
        })

    return {
        "deliveryDate": delivery_date,
        "baseDemandMW": base_demand_mw,
        "confidenceLevel": confidence_level,
        "recommendedBufferMW": round(buffer_mw, 2),
        "periods": simulated
    }
