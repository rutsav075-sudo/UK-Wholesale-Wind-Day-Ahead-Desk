import React from "react"
import { Wind, Clock, Calendar, RefreshCw, Layers } from "lucide-react"

export default function Header({
  dates,
  selectedDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  viewMode,
  onViewModeChange,
  onSync,
  syncing
}) {
  return (
    <header className="header">
      <div className="brand-section">
        <div className="brand-logo">
          <Wind size={24} color="#041014" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="brand-title">Elexon Wind Day-Ahead Desk</h1>
          <p className="brand-subtitle">UK Power Procurement & Quantitative Renewable Forecast Evaluation</p>
        </div>
      </div>

      <div className="control-bar">
        <div className="control-item">
          <Calendar size={16} color="var(--accent-cyan)" />
          <label htmlFor="date-select" style={{ marginRight: 4 }}>Delivery:</label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <Clock size={16} color="var(--accent-amber)" />
          <label htmlFor="cutoff-select" style={{ marginRight: 4 }}>DA Decision Cutoff (D-1):</label>
          <select
            id="cutoff-select"
            value={cutoffHour}
            onChange={(e) => onCutoffChange(Number(e.target.value))}
          >
            <option value={9}>09:00 GMT (Early Morning)</option>
            <option value={10}>10:00 GMT (Pre-Auction)</option>
            <option value={11}>11:00 GMT (EPEX / NordPool Gate)</option>
            <option value={12}>12:00 GMT (Noon Auction)</option>
            <option value={14}>14:00 GMT (Post-Auction)</option>
            <option value={17}>17:00 GMT (Evening Re-Hedging)</option>
          </select>
        </div>

        <div className="control-item">
          <Layers size={16} color="var(--accent-purple)" />
          <label htmlFor="view-mode-select" style={{ marginRight: 4 }}>Resolution:</label>
          <select
            id="view-mode-select"
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value)}
          >
            <option value="half-hour">30-Min (Settlement Periods 1-48)</option>
            <option value="hourly">60-Min (Hourly Aggregated)</option>
          </select>
        </div>

        <button
          className="btn-secondary"
          onClick={onSync}
          disabled={syncing}
          title="Sync latest records from Elexon BMRS API"
        >
          <RefreshCw size={14} className={syncing ? "spin" : ""} />
          {syncing ? "Syncing..." : "Sync API"}
        </button>
      </div>
    </header>
  )
}
