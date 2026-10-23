import React, { useState } from "react"
import { ArrowUpDown, Eye, Calendar } from "lucide-react"

export default function PerformanceTable({ dailyStats, onSelectDate, selectedDate }) {
  const [sortField, setSortField] = useState("date")
  const [sortAsc, setSortAsc] = useState(true)

  if (!dailyStats || !dailyStats.length) {
    return <div className="card">Loading daily audit data...</div>
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const sorted = [...dailyStats].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    if (typeof aVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortAsc ? aVal - bVal : bVal - aVal
  })

  return (
    <div className="card">
      <div className="card-title-row">
        <div>
          <h2 className="card-title">
            <Calendar size={18} color="var(--accent-cyan)" />
            January 2026 Daily Performance & Forecast Error Audit
          </h2>
          <p className="card-description">
            Complete daily breakdown of forecast metrics across all 31 delivery days. Click any row or inspect button to drill down.
          </p>
        </div>
      </div>

      <div className="table-wrapper" style={{ maxHeight: "480px" }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                Delivery Date <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("avgActual")} style={{ cursor: "pointer" }}>
                Avg Actual <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("avgForecast")} style={{ cursor: "pointer" }}>
                Avg DA Forecast <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("mae")} style={{ cursor: "pointer" }}>
                MAE (MW) <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("rmse")} style={{ cursor: "pointer" }}>
                RMSE (MW) <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("wape")} style={{ cursor: "pointer" }}>
                WAPE (%) <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("bias")} style={{ cursor: "pointer" }}>
                Mean Bias <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th onClick={() => handleSort("overForecastRatio")} style={{ cursor: "pointer" }}>
                Over-Forecast % <ArrowUpDown size={12} style={{ display: "inline" }} />
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isSelected = row.date === selectedDate
              return (
                <tr
                  key={row.date}
                  style={{
                    background: isSelected ? "rgba(6, 182, 212, 0.1)" : undefined,
                    borderLeft: isSelected ? "3px solid var(--accent-cyan)" : undefined
                  }}
                >
                  <td className="mono" style={{ fontWeight: 600 }}>{row.date}</td>
                  <td className="mono" style={{ color: "#10b981" }}>{row.avgActual.toLocaleString()} MW</td>
                  <td className="mono" style={{ color: "#06b6d4" }}>{row.avgForecast.toLocaleString()} MW</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{row.mae.toLocaleString()} MW</td>
                  <td className="mono">{row.rmse.toLocaleString()} MW</td>
                  <td>
                    <span className={`badge ${row.wape > 25 ? "badge-negative" : row.wape > 15 ? "badge-warning" : "badge-positive"}`}>
                      {row.wape}%
                    </span>
                  </td>
                  <td className="mono" style={{ color: row.bias > 0 ? "#fbbf24" : "#34d399" }}>
                    {row.bias > 0 ? `+${row.bias}` : row.bias} MW
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "50px",
                        height: "6px",
                        background: "#334155",
                        borderRadius: "3px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${row.overForecastRatio}%`,
                          height: "100%",
                          background: row.overForecastRatio > 70 ? "#f59e0b" : "#10b981"
                        }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.overForecastRatio}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                      onClick={() => onSelectDate(row.date)}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
