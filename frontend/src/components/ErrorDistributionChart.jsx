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
        background: "var(--bg-panel)",
        border: "1px solid var(--border-strong)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontSize: "12px",
        color: "var(--text-main)"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
          {data.range}
        </div>
        <div style={{ color: "var(--text-muted)" }}>
          Sample Count: <strong className="mono" style={{ color: "var(--text-main)" }}>{data.count}</strong> periods ({data.percentage}%)
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: "11px", marginTop: "4px" }}>
          {data.binStart >= 0 ? "Over-forecast (Procurement Deficit Risk)" : "Under-forecast (Generation Surplus)"}
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
          <h2 className="card-title">Forecast Error Distribution & Risk Quantiles</h2>
          <p className="card-description">
            Empirical distribution of Day-Ahead forecast errors across January 2026 for sizing safety buffers
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge badge-negative">P90 Risk: +{statistics.p90?.toLocaleString()} MW</span>
          <span className="badge badge-warning">Median: {statistics.p50 > 0 ? "+" : ""}{statistics.p50?.toLocaleString()} MW</span>
          <span className="badge badge-positive">P10 Surplus: {statistics.p10?.toLocaleString()} MW</span>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={histogram} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
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
              label={{ value: "Settlement Periods", angle: -90, position: "insideLeft", fill: "var(--text-dim)", fontSize: 11 }}
            />
            <Tooltip content={<CustomDistTooltip />} />
            <ReferenceLine x="0 to 500 MW" stroke="var(--border-strong)" strokeDasharray="2 2" />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {histogram.map((entry, index) => {
                const isOver = entry.binStart >= 0
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isOver ? "var(--col-over-risk)" : "var(--col-surplus)"}
                    fillOpacity={0.7}
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
        gap: "10px",
        marginTop: "16px",
        paddingTop: "16px",
        borderTop: "1px solid var(--border-subtle)"
      }}>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Periods Sampled</span>
          <strong className="mono" style={{ fontSize: "14px" }}>{statistics.sampleCount?.toLocaleString()}</strong>
        </div>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Mean Bias</span>
          <strong className="mono" style={{ fontSize: "14px", color: statistics.mean > 0 ? "var(--col-over-risk)" : "var(--col-surplus)" }}>
            {statistics.mean > 0 ? `+${statistics.mean}` : statistics.mean} MW
          </strong>
        </div>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Std. Deviation</span>
          <strong className="mono" style={{ fontSize: "14px" }}>±{statistics.stdDev?.toLocaleString()} MW</strong>
        </div>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>P90 Tail Exposure</span>
          <strong className="mono" style={{ fontSize: "14px", color: "var(--col-over-risk)" }}>+{statistics.p90?.toLocaleString()} MW</strong>
        </div>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>P95 Extreme Exposure</span>
          <strong className="mono" style={{ fontSize: "14px", color: "var(--col-thermal)" }}>+{statistics.p95?.toLocaleString()} MW</strong>
        </div>
      </div>
    </div>
  )
}
