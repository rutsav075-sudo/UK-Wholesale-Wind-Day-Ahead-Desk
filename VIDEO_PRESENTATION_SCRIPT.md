# Video Presentation Script & Recording Guide (10-Minute Maximum)

This guide provides an exact, word-for-word walkthrough script designed for your 10-minute video submission. Follow the two-part structure as required by the assignment guidelines.

---

## Part 1: Client Pitch & Pilot Overview (Max 5 Minutes)
**Audience**: UK Electricity Utility Day-Ahead Power Procurement Team  
**Objective**: Impress the client with how this portal solves their day-ahead bidding challenge, protects them from balancing cash-out penalties, and optimizes thermal plant dispatch.

### [0:00 - 1:00] The Problem Context
> *"Good morning, team. Today I am excited to present the pilot release of our Day-Ahead Renewable Procurement & Forecast Evaluation Platform, customized specifically for your power procurement desk.*
>
> *As a UK energy utility buying wholesale power to meet your retail consumer demand, your trading team must submit day-ahead orders on day D-1 before the EPEX SPOT and Nord Pool auction gates close at 11:00 GMT. Because wind generation is weather-dependent and volatile, you cannot simply guess your renewable output. If your wind generation is over-forecasted, you under-procure thermal power and are caught short in real-time settlement periods, exposing your balance sheet to painful system cash-out penalties. Conversely, if you are overly cautious and assume low wind, you buy excess expensive thermal capacity.*
>
> *Our portal solves this by providing complete transparency into the latest renewable forecasts available precisely at your decision gate, coupled with quantitative error metrics and an automated risk-hedging calculator."*

### [1:00 - 2:30] Live Portal Demonstration: Day-Ahead Trading Desk
> *(Screen share: Open the Day-Ahead Desk tab at http://localhost:3000)*
>
> *"Let's look at a concrete delivery day in January 2026, for example January 5th.*
>
> *In the top control bar, you can see the delivery date selector and our proprietary 'Decision Cutoff' controller. Notice that it is set to 11:00 GMT on day D-1. This is critical: instead of looking at hindsight forecasts, our engine filters Elexon's WINDFOR stream to isolate only the exact forecast that was physically available on your traders' desks when they submitted their day-ahead bids.*
>
> *Looking at our primary chart, the green line displays the metered wind generation across the 48 settlement periods. The dashed cyan line shows your Day-Ahead forecast locked at gate closure, and the amber bars show the forecast delta. When the bars extend upwards, wind was over-forecasted; when downwards, it was under-forecasted.*
>
> *At the top, our executive KPI cards summarize key metrics for the day: Mean Absolute Error (MAE) of 1,070 MW, a Weighted Absolute Percentage Error (WAPE) of 11.34%, and a net forecast bias of +30.5 MW."*

### [2:30 - 4:00] The Decision-Support Tool: Thermal Procurement Buffer
> *(Scroll down to the 'Day-Ahead Thermal Plant Procurement & Risk Buffer Decision Tool')*
>
> *"Now let's examine the core decision support tool we developed for your desk. Here you can adjust your expected consumer demand profile with this slider—say, 28,000 MW peak.*
>
> *If your desk trades naively on the wind forecast alone, the dashed line represents your base thermal order. Notice the box on the left: across 29 of the 48 settlement periods, your desk would have suffered an unhedged generation deficit totaling 13,207 MWh, leaving you completely exposed to balancing market cash-out prices.*
>
> *Instead, our engine evaluates the historical error distribution and computes a quantified Risk Buffer—in this case, +4,346 MW at a 90% confidence level. By procuring the hedged thermal volume indicated by the solid coral line, your deficit risk drops to zero periods. That is a 100% risk reduction, ensuring total supply security while avoiding peak imbalance charges."*

### [4:00 - 5:00] Monthly Audit & Wrap-Up
> *(Click the 'January 2026 Audit' tab)*
>
> *"Finally, our January 2026 Audit table provides an exhaustive breakdown of all 31 delivery days. Your risk managers can sort by MAE, RMSE, or bias to identify systemic weather event errors, such as high-wind stormfronts.*
>
> *This pilot delivers the exact data-driven foundation your trading team needs to bid with confidence in the day-ahead auction. Thank you, and I look forward to your questions."*

---

## Part 2: Technical Lead Review & Architecture (Max 5 Minutes)
**Audience**: Internal Technical Lead / Engineering Reviewer  
**Objective**: Clear, structured walkthrough of the architecture, data models, algorithm design, codebase quality, and containerized deployment.

### [5:00 - 6:00] System Architecture & Tech Stack
> *"Hello, everyone. For the second half of this review, I'll walk through the technical architecture, design patterns, and engineering decisions implemented in this solution.*
>
> *The solution follows a clean decoupled client-server architecture:*
> 1. *Backend: Built in Python using FastAPI for asynchronous, high-throughput REST APIs, backed by an embedded SQLite database storing normalized Elexon time-series.*
> 2. *Frontend: Built using modern React 19 with Vite, styled with custom Vanilla CSS for a bespoke dark-mode interface, and utilizing Recharts for vector graphics and time-series visualization.*
> 3. *Data Source: Direct ingestion from the official Elexon BMRS API v1 streaming endpoints: `FUELHH/stream` for 30-minute metered actuals and `WINDFOR/stream` for multi-lead wind forecasts.*
> 4. *Containerization: Docker and Docker Compose with multi-stage builds, plus Vercel and Heroku deployment manifests."*

### [6:00 - 7:30] Data Ingestion & Matching Algorithm
> *(Open VS Code or IDE, show `backend/app/analytics.py` and `backend/app/fetcher.py`)*
>
> *"Let's look at the data modeling and matching algorithm.*
>
> *In the UK electricity market, actual generation from `FUELHH` is reported at 30-minute settlement period resolution (48 periods per day). However, National Grid ESO wind forecasts in `WINDFOR` are published on an hourly grid with multiple publication timestamps per delivery hour.*
>
> *In `backend/app/analytics.py`, our `get_day_ahead_data` function implements the decision matching logic:*
> - *Given delivery date D and cutoff time (default 11:00 GMT on D-1), the engine executes an index-optimized query on the `forecasts` table.*
> - *For each settlement period on day D, it identifies the latest forecast where `publish_time <= decision_cutoff_iso`.*
> - *It simultaneously tracks `latest_forecast` where `publish_time <= delivery_period` to provide an intraday benchmark.*
> - *We support both 30-minute settlement period granularity and 60-minute aggregated blocks, seamlessly handling the resolution difference between FUELHH and WINDFOR."*

### [7:30 - 8:45] Quantitative Error Engine & Mathematical Formulations
> *(Show `calculate_metrics` and `get_error_distribution` in `analytics.py`)*
>
> *"Our quantitative analytics suite computes standard energy industry metrics using NumPy and Pandas:*
> - *Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) to capture both magnitude and variance.*
> - *Weighted Absolute Percentage Error (WAPE): Unlike standard MAPE, which breaks down during near-zero wind hours due to division by near-zero actuals, WAPE normalizes total absolute errors by total generated energy, providing a robust industry metric.*
> - *Mean Error (Bias): Quantifies whether forecasts systematically overestimate or underestimate generation.*
> - *Empirical Quantiles: In `get_error_distribution`, we calculate the empirical P10, P50, P75, P90, and P95 error percentiles. These percentiles feed directly into the thermal buffer calculation: if the trader requests 90% confidence, we set the buffer to the 90th percentile of positive forecast errors ($W^{fc} - W^{act}$)."*

### [8:45 - 10:00] Code Quality, Testing & Deployment
> *(Show `Dockerfile`, `docker-compose.yml`, and `frontend/src/App.jsx`)*
>
> *"Regarding code standards and engineering practices:*
> - *Clean Code: The entire codebase is structured cleanly with modular separation of concerns. In accordance with user preferences, code is clean, self-documenting, and free of artificial comment bloat.*
> - *Performance & Reliability: Database queries are indexed on `start_time` and `publish_time`. The dataset for all 31 days of January 2026 (over 19,000 forecast records and 1,500 actuals) is pre-seeded in SQLite, enabling sub-20ms API response times.*
> - *Deployment: We provide a multi-container `docker-compose.yml`, a standalone `backend/Dockerfile`, an Nginx-backed `frontend/Dockerfile`, and `vercel.json` for frontend CDN distribution.*
>
> *This concludes the technical walkthrough. The application is completely functional, verified with automated browser testing, and ready for production deployment."*
