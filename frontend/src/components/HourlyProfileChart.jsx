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

const CustomHourlyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-strong)",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "12px",
        minWidth: "200px"
      }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
          Hour {data.label} GMT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", margin: "2px 0" }}>
          <span>Avg Actual Wind:</span>
          <strong>{data.avgActualMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#06b6d4", margin: "2px 0" }}>
          <span>Avg DA Forecast:</span>
          <strong>{data.avgForecastMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#f43f5e", margin: "2px 0" }}>
          <span>Hourly MAE:</span>
          <strong>{data.maeMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: data.avgErrorMW > 0 ? "#fbbf24" : "#34d399",
          marginTop: "4px",
          paddingTop: "4px",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <span>Mean Bias:</span>
          <strong>{data.avgErrorMW > 0 ? `+${data.avgErrorMW}` : data.avgErrorMW} MW</strong>
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
            Analysis of forecast fidelity during morning ramp (06:00-09:00) and evening peak demand (17:00-20:00)
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={profile} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
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
              name="Mean Absolute Error (MAE MW)"
              fill="#f43f5e"
              opacity={0.35}
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="avgActualMW"
              name="Avg Actual Wind (MW)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10b981" }}
            />
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="avgForecastMW"
              name="Avg Day-Ahead Forecast (MW)"
              stroke="#06b6d4"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#06b6d4" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
