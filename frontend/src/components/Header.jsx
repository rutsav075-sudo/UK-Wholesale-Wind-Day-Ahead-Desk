import React from "react"
import { Wind, Clock, Calendar, RefreshCw, Layers, Sun, Moon } from "lucide-react"

export default function Header({
  dates,
  selectedDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  viewMode,
  onViewModeChange,
  onSync,
  syncing,
  theme,
  onToggleTheme
}) {
  return (
    <>
      <div className="top-notice-bar">
        <div className="data-source-tags">
          <span className="tag">ELEXON BMRS</span>
          <span className="tag">FUELHH (WIND)</span>
          <span className="tag">WINDFOR STREAM</span>
          <span className="tag">GB NATIONAL GRID ESO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Auction Day D-1 Gate Closure: 11:00 GMT</span>
          <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle Dark/Light Mode">
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      <header className="header">
        <div className="brand-section">
          <div className="brand-icon">
            <Wind size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="brand-title">UK Wholesale Wind Day-Ahead Desk</h1>
            <p className="brand-subtitle">Energy Utility Renewable Procurement & Forecast Error Quantifier</p>
          </div>
        </div>

        <div className="control-bar">
          <div className="control-group">
            <Calendar size={14} color="var(--col-wind-da)" />
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

          <div className="control-group">
            <Clock size={14} color="var(--col-thermal)" />
            <label htmlFor="cutoff-select" style={{ marginRight: 4 }}>Decision Gate Cutoff:</label>
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

          <div className="control-group">
            <Layers size={14} color="var(--col-wind-latest)" />
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
            <RefreshCw size={13} className={syncing ? "spin" : ""} />
            {syncing ? "Syncing..." : "Sync BMRS"}
          </button>
        </div>
      </header>
    </>
  )
}
