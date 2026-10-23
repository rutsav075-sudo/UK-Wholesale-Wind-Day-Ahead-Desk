import React from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts"
import { ShieldCheck, AlertTriangle, Zap, Sliders } from "lucide-react"

const CustomProcureTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-strong)",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "12px",
        minWidth: "240px"
      }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
          SP {data.settlementPeriod} • {data.startTime.slice(11, 16)} GMT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", margin: "2px 0" }}>
          <span>Consumer Demand:</span>
          <strong>{data.demandMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#06b6d4", margin: "2px 0" }}>
          <span>Wind Forecast:</span>
          <strong>{data.windForecastMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", margin: "2px 0" }}>
          <span>Actual Wind:</span>
          <strong>{data.actualWindMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#f59e0b",
          marginTop: "4px",
          paddingTop: "4px",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <span>Base Thermal Needed:</span>
          <strong>{data.baseThermalProcuredMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#fb7185", margin: "2px 0" }}>
          <span>Hedged Thermal (w/ Buffer):</span>
          <strong>{data.hedgedThermalProcuredMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: data.unhedgedImbalanceMW < 0 ? "#ef4444" : "#10b981",
          marginTop: "4px",
          fontSize: "11px"
        }}>
          <span>Unhedged Exposure:</span>
          <strong>{data.unhedgedImbalanceMW < 0 ? `Deficit: ${Math.abs(data.unhedgedImbalanceMW)} MW` : "Covered"}</strong>
        </div>
      </div>
    )
  }
  return null
}

export default function ThermalProcurementCalculator({
  simData,
  baseDemand,
  onBaseDemandChange,
  confidenceLevel,
  onConfidenceChange
}) {
  if (!simData || !simData.periods) {
    return <div className="card">Loading procurement simulation...</div>
  }

  const { periods, recommendedBufferMW } = simData

  const unhedgedDeficitPeriods = periods.filter(p => p.unhedgedImbalanceMW < 0).length
  const hedgedDeficitPeriods = periods.filter(p => p.hedgedImbalanceMW < 0).length
  const totalUnhedgedDeficitMWh = Math.round(
    periods
      .filter(p => p.unhedgedImbalanceMW < 0)
      .reduce((acc, p) => acc + Math.abs(p.unhedgedImbalanceMW) * 0.5, 0)
  )
  const totalHedgedDeficitMWh = Math.round(
    periods
      .filter(p => p.hedgedImbalanceMW < 0)
      .reduce((acc, p) => acc + Math.abs(p.hedgedImbalanceMW) * 0.5, 0)
  )

  const chartData = periods.map(p => ({
    ...p,
    timeLabel: p.startTime.slice(11, 16)
  }))

  return (
    <div className="card">
      <div className="card-title-row">
        <div>
          <h2 className="card-title">
            <Zap size={20} color="var(--accent-amber)" />
            Day-Ahead Thermal Plant Procurement & Risk Buffer Decision Tool
          </h2>
          <p className="card-description">
            Quantify how much conventional thermal power to procure on D-1 beyond wind forecasts to satisfy customer demand and avoid costly cash-out imbalance penalties
          </p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "24px",
        background: "rgba(15, 23, 42, 0.5)",
        padding: "18px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)"
      }}>
        <div>
          <div className="sim-label" style={{ marginBottom: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sliders size={14} /> Peak Utility Consumer Demand:
            </span>
            <strong className="sim-val">{baseDemand.toLocaleString()} MW</strong>
          </div>
          <input
            type="range"
            min="15000"
            max="45000"
            step="1000"
            value={baseDemand}
            onChange={(e) => onBaseDemandChange(Number(e.target.value))}
            className="range-slider"
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
            <span>15,000 MW</span>
            <span>30,000 MW (Standard UK)</span>
            <span>45,000 MW</span>
          </div>
        </div>

        <div>
          <div className="sim-label" style={{ marginBottom: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} color="var(--accent-cyan)" /> Reliability Confidence Hedging Level:
            </span>
            <strong className="sim-val">{(confidenceLevel * 100).toFixed(0)}%</strong>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { val: 0.50, label: "50% (Neutral)" },
              { val: 0.75, label: "75% (Moderate)" },
              { val: 0.90, label: "90% (Prudent)" },
              { val: 0.95, label: "95% (Conservative)" }
            ].map(lvl => (
              <button
                key={lvl.val}
                className={`btn-secondary ${confidenceLevel === lvl.val ? "active" : ""}`}
                style={{
                  flex: 1,
                  fontSize: "11px",
                  padding: "8px 4px",
                  justifyContent: "center",
                  background: confidenceLevel === lvl.val ? "rgba(6, 182, 212, 0.2)" : undefined,
                  borderColor: confidenceLevel === lvl.val ? "var(--accent-cyan)" : undefined,
                  color: confidenceLevel === lvl.val ? "#fff" : undefined
                }}
                onClick={() => onConfidenceChange(lvl.val)}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-box" style={{ background: "rgba(6, 182, 212, 0.08)", borderColor: "rgba(6, 182, 212, 0.3)" }}>
          <span style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: 600, textTransform: "uppercase" }}>
            Recommended Wind Risk Buffer
          </span>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>
            +{recommendedBufferMW?.toLocaleString()} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>MW</span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Derived from empirical error distribution to absorb unexpected wind drop-outs
          </span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px",
        marginBottom: "20px"
      }}>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Naive Day-Ahead Deficit Risk</span>
          <strong style={{ fontSize: "16px", color: unhedgedDeficitPeriods > 0 ? "#fb7185" : "#10b981" }}>
            {unhedgedDeficitPeriods} / 48 periods ({totalUnhedgedDeficitMWh.toLocaleString()} MWh short)
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Exposed to cash-out imbalance surcharge
          </span>
        </div>

        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Hedged Deficit Risk (w/ Buffer)</span>
          <strong style={{ fontSize: "16px", color: hedgedDeficitPeriods === 0 ? "#34d399" : "#fbbf24" }}>
            {hedgedDeficitPeriods} / 48 periods ({totalHedgedDeficitMWh.toLocaleString()} MWh short)
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {((1 - (totalHedgedDeficitMWh / (totalUnhedgedDeficitMWh || 1))) * 100).toFixed(0)}% risk reduction
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="timeLabel" stroke="var(--text-dim)" tick={{ fontSize: 11 }} interval={3} />
            <YAxis
              stroke="var(--text-dim)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
            />
            <Tooltip content={<CustomProcureTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />

            <Area
              type="monotone"
              dataKey="demandMW"
              name="Consumer Demand"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.08}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="hedgedThermalProcuredMW"
              name="Hedged Thermal Procurement (w/ Buffer)"
              stroke="#fb7185"
              fill="#fb7185"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="baseThermalProcuredMW"
              name="Base Thermal (Naive Demand - Wind Forecast)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actualResidualDemandMW"
              name="Actual Residual Thermal Demand (Truth)"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
