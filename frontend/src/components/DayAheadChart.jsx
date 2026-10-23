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
  ReferenceLine,
  Cell
} from "recharts"

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-strong)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontSize: "12px",
        minWidth: "220px",
        color: "var(--text-main)"
      }}>
        <div style={{ fontWeight: 600, borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px", marginBottom: "6px" }}>
          SP {data.settlementPeriod} • {data.timeLabel} GMT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-act)", margin: "2px 0" }}>
          <span>Actual Wind:</span>
          <strong className="mono">{data.actualMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-da)", margin: "2px 0" }}>
          <span>DA Forecast (@ Gate):</span>
          <strong className="mono">{data.dayAheadForecastMW?.toLocaleString()} MW</strong>
        </div>
        {data.latestForecastMW !== null && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-latest)", margin: "2px 0" }}>
            <span>Latest Forecast:</span>
            <strong className="mono">{data.latestForecastMW?.toLocaleString()} MW</strong>
          </div>
        )}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: data.errorMW > 0 ? "var(--col-over-risk)" : "var(--col-surplus)",
          marginTop: "6px",
          paddingTop: "4px",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <span>Forecast Error (DA - Act):</span>
          <strong className="mono">{data.errorMW > 0 ? `+${data.errorMW}` : data.errorMW} MW</strong>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
          {data.errorMW > 0 ? "Over-forecast (Procurement Deficit)" : "Under-forecast (Procurement Surplus)"}
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
          <h2 className="card-title">Day-Ahead Renewable Generation Forecast vs Metered Actuals</h2>
          <p className="card-description">
            Elexon WINDFOR forecast published prior to day-ahead auction gate vs actual FUELHH settlement generation
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="badge badge-neutral">Click period to trace evolution</span>
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
            <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
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
            <ReferenceLine yAxisId="err" y={0} stroke="var(--border-strong)" strokeDasharray="2 2" />

            <Bar
              yAxisId="err"
              dataKey="errorMW"
              name="Forecast Error (DA - Actual)"
              radius={[2, 2, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.errorMW > 0 ? "var(--col-over-risk)" : "var(--col-surplus)"}
                  fillOpacity={0.45}
                />
              ))}
            </Bar>
            <Line
              yAxisId="gen"
              type="monotone"
              dataKey="actualMW"
              name="Actual Wind Generation (FUELHH)"
              stroke="var(--col-wind-act)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "var(--col-wind-act)" }}
            />
            <Line
              yAxisId="gen"
              type="monotone"
              dataKey="dayAheadForecastMW"
              name="Day-Ahead Forecast (WINDFOR @ Gate)"
              stroke="var(--col-wind-da)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 5, fill: "var(--col-wind-da)" }}
            />
            <Line
              yAxisId="gen"
              type="monotone"
              dataKey="latestForecastMW"
              name="Latest Available Forecast"
              stroke="var(--col-wind-latest)"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              opacity={0.65}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
