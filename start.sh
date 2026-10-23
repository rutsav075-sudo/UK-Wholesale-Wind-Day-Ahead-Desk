#!/usr/bin/env bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
sleep 2
cd frontend && npm run dev
