import React from "react"

export default function MetricCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  accentColor = "var(--col-wind-da)",
  badgeText,
  badgeType = "neutral"
}) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {Icon && (
          <div style={{ color: accentColor }}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="metric-value">
        {value} {unit && <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 400 }}>{unit}</span>}
      </div>
      <div className="metric-footer">
        {badgeText && (
          <span className={`badge badge-${badgeType}`}>{badgeText}</span>
        )}
        <span>{subtext}</span>
      </div>
    </div>
  )
}
