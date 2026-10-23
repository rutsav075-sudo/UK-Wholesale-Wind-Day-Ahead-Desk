import React from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from "recharts"

const CustomDistTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-strong)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "12px"
      }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
          {data.range}
        </div>
        <div style={{ color: "var(--accent-cyan)" }}>
          Occurrences: <strong>{data.count}</strong> periods ({data.percentage}%)
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
          {data.binStart >= 0 ? "Over-forecast (Shortfall Risk)" : "Under-forecast (Surplus)"}
        </div>
      </div>
    )
  }
  return null
}

export default function ErrorDistributionChart({ distribution }) {
  if (!distribution || !distribution.histogram) {
    return <div className="card">Loading error distribution...</div>
  }

  const { histogram, statistics } = distribution

  return (
    <div className="card">
      <div className="card-title-row">
        <div>
          <h2 className="card-title">Forecast Error Distribution & Quantiles</h2>
          <p className="card-description">
            Quantified error distribution across January 2026 for sizing risk buffers and procurement margins
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span className="badge badge-warning">P90 Deficit: +{statistics.p90?.toLocaleString()} MW</span>
          <span className="badge badge-neutral">Median Bias: {statistics.p50 > 0 ? "+" : ""}{statistics.p50?.toLocaleString()} MW</span>
          <span className="badge badge-positive">P10 Surplus: {statistics.p10?.toLocaleString()} MW</span>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={histogram} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="range"
              stroke="var(--text-dim)"
              tick={{ fontSize: 10 }}
              interval={1}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              label={{ value: "Periods", angle: -90, position: "insideLeft", fill: "var(--text-dim)", fontSize: 11 }}
            />
            <Tooltip content={<CustomDistTooltip />} />
            <ReferenceLine x="0 to 500 MW" stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map((entry, index) => {
                const isOver = entry.binStart >= 0
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isOver ? "#f59e0b" : "#10b981"}
                    fillOpacity={0.8}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid var(--border-subtle)"
      }}>
        <div className="sim-box" style={{ padding: "10px 14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Sample Count</span>
          <strong style={{ fontSize: "14px", color: "#fff" }}>{statistics.sampleCount?.toLocaleString()} periods</strong>
        </div>
        <div className="sim-box" style={{ padding: "10px 14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Mean Bias (Error)</span>
          <strong style={{ fontSize: "14px", color: statistics.mean > 0 ? "#fbbf24" : "#34d399" }}>
            {statistics.mean > 0 ? `+${statistics.mean}` : statistics.mean} MW
          </strong>
        </div>
        <div className="sim-box" style={{ padding: "10px 14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Std. Deviation</span>
          <strong style={{ fontSize: "14px", color: "#fff" }}>±{statistics.stdDev?.toLocaleString()} MW</strong>
        </div>
        <div className="sim-box" style={{ padding: "10px 14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>90% Risk Buffer</span>
          <strong style={{ fontSize: "14px", color: "#fb7185" }}>{statistics.p90?.toLocaleString()} MW</strong>
        </div>
        <div className="sim-box" style={{ padding: "10px 14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>95% Extreme Buffer</span>
          <strong style={{ fontSize: "14px", color: "#f43f5e" }}>{statistics.p95?.toLocaleString()} MW</strong>
        </div>
      </div>
    </div>
  )
}
