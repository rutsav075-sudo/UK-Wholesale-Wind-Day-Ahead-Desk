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
  CartesianGrid,
  ReferenceLine
} from "recharts"

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-strong)",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        fontSize: "12px",
        minWidth: "220px"
      }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: "6px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px" }}>
          SP {data.settlementPeriod} • {data.timeLabel} GMT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", margin: "3px 0" }}>
          <span>Actual Wind:</span>
          <strong>{data.actualMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#06b6d4", margin: "3px 0" }}>
          <span>Day-Ahead Forecast:</span>
          <strong>{data.dayAheadForecastMW?.toLocaleString()} MW</strong>
        </div>
        {data.latestForecastMW && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#8b5cf6", margin: "3px 0" }}>
            <span>Latest Forecast:</span>
            <strong>{data.latestForecastMW?.toLocaleString()} MW</strong>
          </div>
        )}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: data.errorMW > 0 ? "#f59e0b" : "#34d399",
          marginTop: "6px",
          paddingTop: "4px",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <span>Forecast Error (DA - Act):</span>
          <strong>{data.errorMW > 0 ? `+${data.errorMW}` : data.errorMW} MW</strong>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
          {data.errorMW > 0 ? "Over-forecast (Procurement Deficit Risk)" : "Under-forecast (Generation Surplus)"}
        </div>
      </div>
    )
  }
  return null
}

export default function DayAheadChart({ records, viewMode, onSelectPeriod, selectedPeriod }) {
  let chartData = records.map((r) => ({
    ...r,
    timeLabel: r.startTime.slice(11, 16)
  }))

  if (viewMode === "hourly") {
    const hourlyMap = {}
    records.forEach((r) => {
      const hourStr = r.startTime.slice(11, 13) + ":00"
      if (!hourlyMap[hourStr]) {
        hourlyMap[hourStr] = {
          timeLabel: hourStr,
          settlementPeriod: `${r.settlementPeriod}-${r.settlementPeriod + 1}`,
          actualMW: [],
          dayAheadForecastMW: [],
          latestForecastMW: [],
          startTime: r.startTime
        }
      }
      if (r.actualMW !== null) hourlyMap[hourStr].actualMW.push(r.actualMW)
      if (r.dayAheadForecastMW !== null) hourlyMap[hourStr].dayAheadForecastMW.push(r.dayAheadForecastMW)
      if (r.latestForecastMW !== null) hourlyMap[hourStr].latestForecastMW.push(r.latestForecastMW)
    })

    chartData = Object.values(hourlyMap).map((item) => {
      const avgAct = item.actualMW.length ? Math.round(item.actualMW.reduce((a, b) => a + b, 0) / item.actualMW.length) : null
      const avgDa = item.dayAheadForecastMW.length ? Math.round(item.dayAheadForecastMW.reduce((a, b) => a + b, 0) / item.dayAheadForecastMW.length) : null
      const avgLatest = item.latestForecastMW.length ? Math.round(item.latestForecastMW.reduce((a, b) => a + b, 0) / item.latestForecastMW.length) : null
      const err = (avgDa !== null && avgAct !== null) ? Math.round(avgDa - avgAct) : null
      return {
        ...item,
        actualMW: avgAct,
        dayAheadForecastMW: avgDa,
        latestForecastMW: avgLatest,
        errorMW: err
      }
    })
  }

  return (
    <div className="card">
      <div className="card-title-row">
        <div>
          <h2 className="card-title">Day-Ahead Renewable Generation Forecast vs Actuals</h2>
          <p className="card-description">
            Comparing Elexon Day-Ahead forecast locked at decision gate with actual metered settlement period generation
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="badge badge-neutral">Interactive • Click point to inspect evolution</span>
        </div>
      </div>

      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload.length) {
                onSelectPeriod(e.activePayload[0].payload)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="timeLabel"
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              interval={viewMode === "hourly" ? 1 : 3}
            />
            <YAxis
              yAxisId="gen"
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
            />
            <YAxis
              yAxisId="err"
              orientation="right"
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v} MW`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} />
            <ReferenceLine yAxisId="err" y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" />

            <Bar
              yAxisId="err"
              dataKey="errorMW"
              name="Forecast Error (DA - Actual)"
              fill="#f59e0b"
              opacity={0.35}
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="gen"
              type="monotone"
              dataKey="actualMW"
              name="Actual Wind Generation (FUELHH)"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#10b981" }}
            />
            <Line
              yAxisId="gen"
              type="monotone"
              dataKey="dayAheadForecastMW"
              name="Day-Ahead Forecast (WINDFOR @ Gate)"
              stroke="#06b6d4"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 6, fill: "#06b6d4" }}
            />
            <Line
              yAxisId="gen"
              type="monotone"
              dataKey="latestForecastMW"
              name="Latest Forecast"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              opacity={0.7}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
