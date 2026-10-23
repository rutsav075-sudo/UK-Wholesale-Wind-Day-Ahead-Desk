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
import { ShieldCheck, Zap, Sliders } from "lucide-react"

const CustomProcureTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-strong)",
        borderRadius: "4px",
        padding: "10px 14px",
        fontSize: "12px",
        minWidth: "240px",
        color: "var(--text-main)"
      }}>
        <div style={{ fontWeight: 600, borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px", marginBottom: "6px" }}>
          SP {data.settlementPeriod} • {data.startTime.slice(11, 16)} GMT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-demand)", margin: "2px 0" }}>
          <span>Customer Demand:</span>
          <strong className="mono">{data.demandMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-da)", margin: "2px 0" }}>
          <span>Wind Forecast:</span>
          <strong className="mono">{data.windForecastMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-wind-act)", margin: "2px 0" }}>
          <span>Actual Wind:</span>
          <strong className="mono">{data.actualWindMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--col-thermal)",
          marginTop: "4px",
          paddingTop: "4px",
          borderTop: "1px solid var(--border-subtle)"
        }}>
          <span>Base Thermal Order:</span>
          <strong className="mono">{data.baseThermalProcuredMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--col-over-risk)", margin: "2px 0" }}>
          <span>Hedged Thermal (w/ Buffer):</span>
          <strong className="mono">{data.hedgedThermalProcuredMW?.toLocaleString()} MW</strong>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          color: data.unhedgedImbalanceMW < 0 ? "var(--col-over-risk)" : "var(--col-surplus)",
          marginTop: "4px",
          fontSize: "11px"
        }}>
          <span>Unhedged Exposure:</span>
          <strong>{data.unhedgedImbalanceMW < 0 ? `Deficit: ${Math.abs(data.unhedgedImbalanceMW)} MW` : "Fully Covered"}</strong>
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
            <Zap size={18} color="var(--col-thermal)" />
            Day-Ahead Thermal Generation Procurement & Risk Buffer Simulator
          </h2>
          <p className="card-description">
            Quantify how much dispatchable thermal power to purchase on D-1 beyond wind forecasts to ensure retail demand is covered
          </p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "20px",
        background: "var(--bg-panel)",
        padding: "16px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)"
      }}>
        <div>
          <div className="sim-label" style={{ marginBottom: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sliders size={13} /> Peak Utility Consumer Demand:
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
            <span>15 GW</span>
            <span>28 GW (Typical GB Mid-Winter)</span>
            <span>45 GW</span>
          </div>
        </div>

        <div>
          <div className="sim-label" style={{ marginBottom: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={13} color="var(--col-wind-da)" /> Reliability Confidence Hedging Target:
            </span>
            <strong className="sim-val">{(confidenceLevel * 100).toFixed(0)}%</strong>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
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
                  padding: "6px 2px",
                  justifyContent: "center",
                  background: confidenceLevel === lvl.val ? "var(--bg-surface)" : undefined,
                  borderColor: confidenceLevel === lvl.val ? "var(--border-strong)" : undefined,
                  fontWeight: confidenceLevel === lvl.val ? 600 : 400
                }}
                onClick={() => onConfidenceChange(lvl.val)}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-box" style={{ borderLeft: "3px solid var(--col-thermal)" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recommended Thermal Risk Buffer
          </span>
          <div style={{ fontSize: "20px", fontWeight: 700 }} className="mono">
            +{recommendedBufferMW?.toLocaleString()} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 400 }}>MW</span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
            Sized from empirical error percentiles to prevent cash-out exposure
          </span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: "16px"
      }}>
        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Naive Day-Ahead Deficit Risk</span>
          <strong className="mono" style={{ fontSize: "15px", color: unhedgedDeficitPeriods > 0 ? "var(--col-over-risk)" : "var(--col-surplus)" }}>
            {unhedgedDeficitPeriods} / 48 periods ({totalUnhedgedDeficitMWh.toLocaleString()} MWh)
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Exposed to cash-out imbalance surcharge
          </span>
        </div>

        <div className="sim-box">
          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Hedged Deficit Risk (w/ Buffer)</span>
          <strong className="mono" style={{ fontSize: "15px", color: hedgedDeficitPeriods === 0 ? "var(--col-surplus)" : "var(--col-over-risk)" }}>
            {hedgedDeficitPeriods} / 48 periods ({totalHedgedDeficitMWh.toLocaleString()} MWh)
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {((1 - (totalHedgedDeficitMWh / (totalUnhedgedDeficitMWh || 1))) * 100).toFixed(0)}% exposure reduction
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
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
              stroke="var(--col-demand)"
              fill="var(--col-demand)"
              fillOpacity={0.06}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="hedgedThermalProcuredMW"
              name="Hedged Thermal Procurement (w/ Buffer)"
              stroke="var(--col-over-risk)"
              fill="var(--col-over-risk)"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="baseThermalProcuredMW"
              name="Base Thermal (Naive Demand - Wind Forecast)"
              stroke="var(--col-thermal)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actualResidualDemandMW"
              name="Actual Residual Thermal Demand (Truth)"
              stroke="var(--col-wind-act)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
