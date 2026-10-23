import React from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts"

const CustomHourlyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-strong)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontSize: "12px",
        minWidth: "200px",
        color: "var(--text-main)"
      }}>
        <div style={{ fontWeight: 600, borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px", marginBottom: "6px" }}>
          Delivery Hour {data.label} GMT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-act)", margin: "2px 0" }}>
          <span>Avg Actual Wind:</span>
          <strong className="mono">{data.avgActualMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-da)", margin: "2px 0" }}>
          <span>Avg DA Forecast:</span>
          <strong className="mono">{data.avgForecastMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-over-risk)", margin: "2px 0" }}>
          <span>Hourly MAE:</span>
          <strong className="mono">{data.maeMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: data.avgErrorMW > 0 ? "var(--col-over-risk)" : "var(--col-surplus)",
          marginTop: "4px",
          paddingTop: "4px",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <span>Mean Bias:</span>
          <strong className="mono">{data.avgErrorMW > 0 ? `+${data.avgErrorMW}` : data.avgErrorMW} MW</strong>
        </div>
      </div>
    )
  }
  return null
}

export default function HourlyProfileChart({ profile }) {
  if (!profile || !profile.length) {
    return <div className="card">Loading diurnal profile...</div>
  }

  return (
    <div className="card">
      <div className="card-title-row">
        <div>
          <h2 className="card-title">24-Hour Diurnal Generation & Error Profile</h2>
          <p className="card-description">
            Fidelity across peak morning ramp (06:00-09:00) and evening peak demand (17:00-20:00)
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={profile} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-dim)" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="power"
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
            />
            <YAxis
              yAxisId="mae"
              orientation="right"
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v} MW`}
            />
            <Tooltip content={<CustomHourlyTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />

            <Bar
              yAxisId="mae"
              dataKey="maeMW"
              name="Hourly Mean Absolute Error (MAE)"
              fill="var(--col-over-risk)"
              fillOpacity={0.35}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="avgActualMW"
              name="Avg Actual Wind (MW)"
              stroke="var(--col-wind-act)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--col-wind-act)" }}
            />
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="avgForecastMW"
              name="Avg Day-Ahead Forecast (MW)"
              stroke="var(--col-wind-da)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 2.5, fill: "var(--col-wind-da)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
