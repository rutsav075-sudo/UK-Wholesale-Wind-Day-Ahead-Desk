import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from "recharts"
import { GitCommit, History } from "lucide-react"

export default function ForecastEvolutionChart({ evolutionData, targetTime }) {
  if (!evolutionData || !evolutionData.evolution) {
    return (
      <div className="card">
        <div className="card-title">
          <History size={18} color="var(--accent-purple)" />
          Forecast Evolution Tracker
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
          Select any settlement period on the Day-Ahead chart above to trace how the forecast evolved over time leading up to delivery.
        </p>
      </div>
    )
  }

  const { evolution, actualMW } = evolutionData

  const chartData = evolution.map((item) => ({
    ...item,
    pubLabel: item.publishTime.slice(5, 16).replace("T", " ")
  }))

  return (
    <div className="card">
      <div className="card-title-row">
        <div>
          <h2 className="card-title">
            <History size={18} color="var(--accent-purple)" />
            Multi-Lead Forecast Evolution & Convergence
          </h2>
          <p className="card-description">
            Tracking how the wind forecast for target period <strong style={{ color: "#fff" }}>{targetTime?.replace("T", " ").replace("Z", " GMT")}</strong> changed across publish times
          </p>
        </div>
        <div>
          <span className="badge badge-positive" style={{ fontSize: "12px", padding: "6px 12px" }}>
            Metered Actual: {actualMW?.toLocaleString()} MW
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="pubLabel" stroke="var(--text-dim)" tick={{ fontSize: 10 }} />
            <YAxis
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div style={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px"
                    }}>
                      <div style={{ fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                        Published: {d.publishTime.replace("T", " ").replace("Z", " GMT")}
                      </div>
                      <div style={{ color: "var(--accent-cyan)" }}>
                        Forecast: <strong>{d.forecastMW?.toLocaleString()} MW</strong>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        Lead Time: {d.leadHoursAhead} hrs ahead of delivery
                      </div>
                      <div style={{ color: d.errorMW > 0 ? "#f59e0b" : "#34d399", marginTop: "4px" }}>
                        Delta vs Actual: {d.errorMW > 0 ? `+${d.errorMW}` : d.errorMW} MW
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 8, fontSize: 12 }} />
            {actualMW !== null && (
              <ReferenceLine
                y={actualMW}
                stroke="#10b981"
                strokeWidth={2}
                label={{ value: `Actual (${actualMW} MW)`, fill: "#10b981", fontSize: 11, position: "top" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="forecastMW"
              name="Forecast Published (MW)"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#8b5cf6" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrapper" style={{ marginTop: "16px", maxHeight: "200px" }}>
        <table>
          <thead>
            <tr>
              <th>Publish Time (GMT)</th>
              <th>Lead Time Ahead</th>
              <th>Forecast Generation</th>
              <th>Actual Generation</th>
              <th>Error vs Actual</th>
            </tr>
          </thead>
          <tbody>
            {evolution.map((r, i) => (
              <tr key={i}>
                <td className="mono">{r.publishTime.replace("T", " ").replace("Z", "")}</td>
                <td>{r.leadHoursAhead} hours</td>
                <td className="mono" style={{ color: "var(--accent-cyan)" }}>{r.forecastMW.toLocaleString()} MW</td>
                <td className="mono" style={{ color: "#10b981" }}>{actualMW?.toLocaleString()} MW</td>
                <td className="mono" style={{ color: r.errorMW > 0 ? "#fbbf24" : "#34d399" }}>
                  {r.errorMW > 0 ? `+${r.errorMW}` : r.errorMW} MW
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
