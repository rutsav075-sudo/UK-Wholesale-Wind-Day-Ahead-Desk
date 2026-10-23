import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.db import init_db
from backend.app.fetcher import seed_january_2026

if __name__ == "__main__":
    init_db()
    result = seed_january_2026()
    print("Seed result:", result)
