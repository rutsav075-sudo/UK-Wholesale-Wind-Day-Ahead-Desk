import httpx
from datetime import datetime, timedelta
from backend.app.config import FUELHH_ENDPOINT, WINDFOR_ENDPOINT
from backend.app.db import get_connection

def fetch_elexon_stream(endpoint: str, start_iso: str, end_iso: str):
    params = {
        "publishDateTimeFrom": start_iso,
        "publishDateTimeTo": end_iso
    }
    with httpx.Client(timeout=60.0) as client:
        resp = client.get(endpoint, params=params)
        resp.raise_for_status()
        return resp.json()

def sync_actuals_range(start_iso: str, end_iso: str):
    data = fetch_elexon_stream(FUELHH_ENDPOINT, start_iso, end_iso)
    wind_items = [
        (
            d["startTime"],
            d.get("settlementDate", d["startTime"][:10]),
            d.get("settlementPeriod", 0),
            float(d["generation"])
        )
        for d in data
        if d.get("fuelType") == "WIND" and "startTime" in d and "generation" in d
    ]
    conn = get_connection()
    cur = conn.cursor()
    cur.executemany("""
        INSERT OR REPLACE INTO actuals (start_time, settlement_date, settlement_period, generation)
        VALUES (?, ?, ?, ?)
    """, wind_items)
    conn.commit()
    conn.close()
    return len(wind_items)

def sync_forecasts_range(start_iso: str, end_iso: str):
    data = fetch_elexon_stream(WINDFOR_ENDPOINT, start_iso, end_iso)
    fc_items = [
        (
            d["publishTime"],
            d["startTime"],
            float(d["generation"])
        )
        for d in data
        if "publishTime" in d and "startTime" in d and "generation" in d
    ]
    conn = get_connection()
    cur = conn.cursor()
    cur.executemany("""
        INSERT OR REPLACE INTO forecasts (publish_time, start_time, generation)
        VALUES (?, ?, ?)
    """, fc_items)
    conn.commit()
    conn.close()
    return len(fc_items)

def seed_january_2026():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM actuals")
    act_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM forecasts")
    fc_count = cur.fetchone()[0]
    conn.close()

    if act_count > 1000 and fc_count > 5000:
        return {"status": "already_seeded", "actuals": act_count, "forecasts": fc_count}

    sync_actuals_range("2026-01-01T00:00:00Z", "2026-02-02T00:00:00Z")

    cur_dt = datetime(2025, 12, 31, 0, 0, 0)
    end_dt = datetime(2026, 2, 2, 0, 0, 0)
    total_fc = 0
    while cur_dt < end_dt:
        chunk_end = min(cur_dt + timedelta(days=4), end_dt)
        s_iso = cur_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        e_iso = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        try:
            total_fc += sync_forecasts_range(s_iso, e_iso)
        except Exception:
            pass
        cur_dt = chunk_end

    return {"status": "success", "synced_forecasts": total_fc}
