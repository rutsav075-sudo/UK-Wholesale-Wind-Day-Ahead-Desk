# UK Wind Power Day-Ahead Decision & Forecast Accuracy Platform

An institutional-grade decision support platform built for UK electricity utilities participating in the wholesale Day-Ahead power market (EPEX SPOT GB / Nord Pool GB). The platform integrates official Elexon BMRS renewable datasets (`WINDFOR` and `FUELHH`) to evaluate wind forecast fidelity, quantify error distributions, and determine optimal thermal generation procurement volumes to eliminate costly balancing cash-out penalties.

---

## Live Demo & Deployment

- **Web Application**: `https://elexon-wind-desk.vercel.app` (or your deployed URL on Vercel/Heroku)
- **Backend API**: `https://elexon-wind-backend.herokuapp.com`

---

## Domain Overview & Business Problem

In the UK electricity wholesale market, utility trading desks must purchase power on day $D-1$ to serve forecasted consumer electricity demand on delivery day $D$.
- Day-ahead power auctions close at 11:00 GMT on $D-1$.
- Power procurement decisions require knowing how much residual demand must be contracted from dispatchable thermal plants (e.g., CCGT, peakers) beyond variable renewable wind generation.
- If a utility naively relies on wind forecasts that over-predict actual output, the utility faces a generation deficit in real-time settlement periods, exposing them to expensive system buy prices (cash-out penalties).
- Conversely, under-forecasting leads to over-procurement of expensive thermal power.

This platform bridges the gap by:
1. Locking the latest available wind forecast at the trader's Day-Ahead Decision Gate (e.g., 11:00 GMT on $D-1$).
2. Quantifying empirical forecast error distributions (MAE, RMSE, WAPE, Bias, P90/P95 tail risks) across all 48 half-hour settlement periods in January 2026.
3. Providing an interactive Thermal Plant Procurement & Hedging Calculator that calculates the exact capacity buffer needed to guarantee 90% or 95% delivery reliability.
4. Tracing multi-lead forecast evolution from 48 hours prior down to gate closure.

---

## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py         # Package initialization
│   │   ├── config.py           # Configuration parameters and Elexon BMRS endpoints
│   │   ├── db.py               # SQLite schema and connection manager
│   │   ├── fetcher.py          # Data ingestion engine for Elexon FUELHH and WINDFOR
│   │   ├── analytics.py        # Day-ahead matching, statistical error metrics, hedging logic
│   │   ├── routes.py           # REST API endpoints for frontend consumption
│   │   └── main.py             # FastAPI entry point with CORS configuration
│   ├── data/
│   │   └── elexon_wind.db      # Seeded SQLite database with January 2026 Elexon records
│   ├── Dockerfile              # Container specification for Python FastAPI backend
│   ├── requirements.txt        # Backend dependencies (fastapi, uvicorn, pandas, numpy, httpx)
│   └── seed.py                 # Standalone dataset download and seeding script
├── frontend/
│   ├── public/
│   │   └── favicon.svg         # Platform favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                      # Navigation, date picker, decision gate cutoff selector
│   │   │   ├── MetricCard.jsx                  # KPI indicator cards with variance trends
│   │   │   ├── DayAheadChart.jsx               # Settlement period chart (Actual vs DA Forecast vs Latest)
│   │   │   ├── ErrorDistributionChart.jsx      # Error histogram and empirical quantiles (P10, P50, P90)
│   │   │   ├── HourlyProfileChart.jsx          # 24-hour diurnal profile and hourly error variance
│   │   │   ├── ThermalProcurementCalculator.jsx# Interactive thermal plant hedging simulator
│   │   │   ├── ForecastEvolutionChart.jsx      # Multi-lead convergence tracker across publish times
│   │   │   └── PerformanceTable.jsx            # January 2026 31-day daily audit table
│   │   ├── services/
│   │   │   └── api.js          # Client-side API wrapper
│   │   ├── App.jsx             # Main layout, tab state, and global store
│   │   ├── main.jsx            # React root DOM mount
│   │   └── index.css           # Modern high-contrast trading theme
│   ├── Dockerfile              # Multi-stage production build container (Vite + Nginx)
│   ├── nginx.conf              # Nginx reverse proxy configuration
│   ├── index.html              # HTML shell with metadata
│   ├── package.json            # Frontend dependencies (React, Lucide, Recharts)
│   └── vite.config.js          # Vite configuration with local proxy
├── docker-compose.yml          # Multi-container orchestration
├── vercel.json                 # Vercel deployment configuration
├── Procfile                    # Heroku deployment process definition
├── start.bat                   # 1-click Windows startup script
├── start.sh                    # 1-click Unix/macOS startup script
└── README.md                   # System documentation
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm

### Local Development

#### 1. Start the Backend
```bash
# Navigate to project root
pip install -r backend/requirements.txt

# Run the API server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will run at `http://127.0.0.1:8000`. You can inspect interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

#### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The React frontend will be accessible at `http://localhost:3000`.

#### 3. One-Click Scripts
- **Windows**: Double-click `start.bat` or run `.\start.bat` in Command Prompt.
- **Linux/macOS**: Run `chmod +x start.sh && ./start.sh`.

---

## Running with Docker

To build and run both the backend and frontend containers using Docker Compose:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## Deployment Instructions

### Vercel (Frontend)
1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. Set the Root Directory to `frontend`.
4. Add the environment variable `VITE_API_URL` pointing to your deployed backend (or let Vercel use local rewrites via `vercel.json`).
5. Deploy.

### Heroku (Backend)
1. Create a new Heroku application:
   ```bash
   heroku create elexon-wind-backend
   ```
2. Deploy the Python application:
   ```bash
   git push heroku main
   ```
3. The included `Procfile` and `backend/requirements.txt` will automatically launch Uvicorn.

---

## Dataset & Technical Details

- **Actual Generation**: Elexon BMRS `FUELHH/stream` endpoint, filtered for `fuelType == "WIND"`. Resolution: 30 minutes (48 settlement periods per day).
- **Forecast Generation**: Elexon BMRS `WINDFOR/stream` endpoint. Resolution: Hourly, with rolling forecasts published at multiple lead times.
- **Matching Methodology**:
  - For delivery on day $D$, the purchase decision is made on day $D-1$ before gate closure (default 11:00 GMT).
  - The Day-Ahead Decision Forecast matches each target settlement period with the latest forecast published on or before the $D-1$ cutoff timestamp.
  - The latest forecast corresponds to the most recent publication prior to delivery time.
- **Statistical Metrics Implemented**:
  - **MAE (Mean Absolute Error)**: $\frac{1}{N}\sum |W^{fc}_t - W^{act}_t|$ (MW)
  - **RMSE (Root Mean Square Error)**: $\sqrt{\frac{1}{N}\sum (W^{fc}_t - W^{act}_t)^2}$ (MW)
  - **WAPE (Weighted Absolute Percentage Error)**: $\frac{\sum |W^{fc}_t - W^{act}_t|}{\sum W^{act}_t} \times 100\%$
  - **Forecast Bias**: $\frac{1}{N}\sum (W^{fc}_t - W^{act}_t)$ (indicates systematic over-forecasting vs under-forecasting)
  - **Empirical Quantiles**: P10, P25, P50 (median), P75, P90, P95 used to calculate risk buffers for thermal generation procurement.

---

## AI Tools Disclosure

As explicitly permitted and required by the assignment guidelines, AI development tools were utilized during the creation of this project:
- **Anthropic Claude / Google Gemini**: Assisted with domain research into UK Elexon BMRS settlement structures, data ingestion pipeline design, React UI component layout, and drafting documentation.
All architectural decisions, algorithm implementations, UI styling, and data validation were reviewed, refined, and verified for production readiness.
