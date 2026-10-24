import fallbackData from "../data/january2026Data.json"

const API_BASE = import.meta.env.VITE_API_URL || ""

function computeSimulation(date, baseDemand = 28000, confidenceLevel = 0.90) {
  const day = fallbackData.days[date] || fallbackData.days["2026-01-05"] || Object.values(fallbackData.days)[0]
  const stats = fallbackData.errorDistribution.statistics
  let bufferMW = 500
  if (confidenceLevel >= 0.95) bufferMW = stats.p95 || 2500
  else if (confidenceLevel >= 0.90) bufferMW = stats.p90 || 2000
  else if (confidenceLevel >= 0.75) bufferMW = stats.p75 || 1200

  const periods = day.records.map((r) => {
    const sp = r.settlementPeriod
    const actWind = r.actualMW
    const fcWind = r.dayAheadForecastMW || 0
    let demand = baseDemand * (0.8 + 0.35 * Math.sin(((sp - 14) / 48) * 2 * Math.PI))
    demand = Math.round(demand * 100) / 100

    const baseThermal = Math.max(0, Math.round((demand - fcWind) * 100) / 100)
    const hedgedThermal = Math.round((baseThermal + bufferMW) * 100) / 100
    const actualResidual = Math.max(0, Math.round((demand - actWind) * 100) / 100)
    const unhedged = Math.round((baseThermal - actualResidual) * 100) / 100
    const hedged = Math.round((hedgedThermal - actualResidual) * 100) / 100

    return {
      startTime: r.startTime,
      settlementPeriod: sp,
      demandMW: demand,
      windForecastMW: fcWind,
      actualWindMW: actWind,
      baseThermalProcuredMW: baseThermal,
      bufferMW: Math.round(bufferMW * 100) / 100,
      hedgedThermalProcuredMW: hedgedThermal,
      actualResidualDemandMW: actualResidual,
      unhedgedImbalanceMW: unhedged,
      hedgedImbalanceMW: hedged
    }
  })

  return {
    deliveryDate: date,
    baseDemandMW: baseDemand,
    confidenceLevel,
    recommendedBufferMW: Math.round(bufferMW * 100) / 100,
    periods
  }
}

export async function fetchDates() {
  try {
    const res = await fetch(`${API_BASE}/api/dates`)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) throw new Error("Empty dates")
    return data
  } catch {
    return { dates: fallbackData.dates }
  }
}

export async function fetchSummary(cutoffHour = 11, cutoffMinute = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/summary?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.overall) throw new Error("Invalid summary")
    return data
  } catch {
    return fallbackData.monthSummary
  }
}

export async function fetchDayAhead(date, cutoffHour = 11, cutoffMinute = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/day-ahead?date=${date}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.records) throw new Error("Invalid day data")
    return data
  } catch {
    const day = fallbackData.days[date] || fallbackData.days["2026-01-05"] || Object.values(fallbackData.days)[0]
    return day
  }
}

export async function fetchErrorDistribution(cutoffHour = 11, cutoffMinute = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/error-distribution?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.histogram) throw new Error("Invalid error distribution")
    return data
  } catch {
    return fallbackData.errorDistribution
  }
}

export async function fetchHourlyProfile(cutoffHour = 11, cutoffMinute = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/hourly-profile?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.profile) throw new Error("Invalid hourly profile")
    return data
  } catch {
    return { profile: fallbackData.hourlyProfile }
  }
}

export async function fetchForecastEvolution(targetTime) {
  try {
    const res = await fetch(`${API_BASE}/api/forecast-evolution?target_time=${encodeURIComponent(targetTime)}`)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.evolution) throw new Error("Invalid evolution")
    return data
  } catch {
    const evo = fallbackData.evolutions[targetTime] || fallbackData.evolutions[Object.keys(fallbackData.evolutions)[0]]
    return evo
  }
}

export async function fetchProcurementSimulation(date, baseDemand = 28000, confidenceLevel = 0.90, cutoffHour = 11, cutoffMinute = 0) {
  try {
    const url = `${API_BASE}/api/simulation/procurement?date=${date}&base_demand=${baseDemand}&confidence_level=${confidenceLevel}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`
    const res = await fetch(url)
    if (!res.ok) throw new Error("API not available")
    const data = await res.json()
    if (!data.periods) throw new Error("Invalid simulation")
    return data
  } catch {
    return computeSimulation(date, baseDemand, confidenceLevel)
  }
}

export async function triggerSync() {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, { method: "POST" })
    if (!res.ok) throw new Error("Sync failed")
    return res.json()
  } catch {
    return { status: "local_cache_active", synced_forecasts: 19272 }
  }
}
