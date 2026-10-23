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
import { History } from "lucide-react"

export default function ForecastEvolutionChart({ evolutionData, targetTime }) {
  if (!evolutionData || !evolutionData.evolution) {
    return (
      <div className="card">
        <div className="card-title">
          <History size={16} color="var(--col-wind-da)" />
          Forecast Evolution Tracker
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "8px" }}>
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
            <History size={16} color="var(--col-wind-da)" />
            Multi-Lead Forecast Evolution & Convergence Tracker
          </h2>
          <p className="card-description">
            Progression of forecasts published by National Grid ESO for target period <strong style={{ color: "var(--text-main)" }}>{targetTime?.replace("T", " ").replace("Z", " GMT")}</strong>
          </p>
        </div>
        <div>
          <span className="badge badge-positive" style={{ fontSize: "12px", padding: "4px 10px" }}>
            Metered Actual: {actualMW?.toLocaleString()} MW
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
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
                      background: "var(--bg-panel)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "4px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      color: "var(--text-main)"
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        Published: {d.publishTime.replace("T", " ").replace("Z", " GMT")}
                      </div>
                      <div style={{ color: "var(--col-wind-da)" }}>
                        Forecast: <strong className="mono">{d.forecastMW?.toLocaleString()} MW</strong>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        Lead Horizon: {d.leadHoursAhead} hrs ahead of delivery
                      </div>
                      <div style={{ color: d.errorMW > 0 ? "var(--col-over-risk)" : "var(--col-surplus)", marginTop: "4px" }}>
                        Error vs Actual: <strong className="mono">{d.errorMW > 0 ? `+${d.errorMW}` : d.errorMW} MW</strong>
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
                stroke="var(--col-wind-act)"
                strokeWidth={2}
                label={{ value: `Actual (${actualMW} MW)`, fill: "var(--col-wind-act)", fontSize: 11, position: "top" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="forecastMW"
              name="Forecast Published (MW)"
              stroke="var(--col-wind-da)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--col-wind-da)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrapper" style={{ marginTop: "16px", maxHeight: "200px" }}>
        <table>
          <thead>
            <tr>
              <th>Publish Timestamp (GMT)</th>
              <th>Lead Horizon</th>
              <th>Forecast Generation</th>
              <th>Metered Actual</th>
              <th>Variance vs Actual</th>
            </tr>
          </thead>
          <tbody>
            {evolution.map((r, i) => (
              <tr key={i}>
                <td className="mono">{r.publishTime.replace("T", " ").replace("Z", "")}</td>
                <td>{r.leadHoursAhead} hrs</td>
                <td className="mono" style={{ color: "var(--col-wind-da)" }}>{r.forecastMW.toLocaleString()} MW</td>
                <td className="mono" style={{ color: "var(--col-wind-act)" }}>{actualMW?.toLocaleString()} MW</td>
                <td className="mono" style={{ color: r.errorMW > 0 ? "var(--col-over-risk)" : "var(--col-surplus)" }}>
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
