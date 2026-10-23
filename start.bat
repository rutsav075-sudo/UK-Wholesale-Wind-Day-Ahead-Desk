@echo off
start cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 >nul
cd frontend
start cmd /k "npm run dev"
