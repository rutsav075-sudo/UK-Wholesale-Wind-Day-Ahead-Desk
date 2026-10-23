import sqlite3
from backend.app.config import DB_PATH

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS actuals (
            start_time TEXT PRIMARY KEY,
            settlement_date TEXT,
            settlement_period INTEGER,
            generation REAL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS forecasts (
            publish_time TEXT,
            start_time TEXT,
            generation REAL,
            PRIMARY KEY (publish_time, start_time)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fc_start ON forecasts(start_time)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fc_pub ON forecasts(publish_time)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_act_date ON actuals(settlement_date)")
    conn.commit()
    conn.close()
