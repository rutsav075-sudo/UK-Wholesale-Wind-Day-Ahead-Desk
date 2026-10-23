import React from "react"

export default function MetricCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  accentColor = "var(--accent-cyan)",
  badgeText,
  badgeType = "neutral"
}) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <div
          className="metric-icon-wrap"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <div className="metric-value">
        {value} {unit && <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 500 }}>{unit}</span>}
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
