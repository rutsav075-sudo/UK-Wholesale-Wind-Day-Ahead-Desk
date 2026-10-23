const API_BASE = import.meta.env.VITE_API_URL || ""

export async function fetchDates() {
  const res = await fetch(`${API_BASE}/api/dates`)
  if (!res.ok) throw new Error("Failed to load dates")
  return res.json()
}

export async function fetchSummary(cutoffHour = 11, cutoffMinute = 0) {
  const res = await fetch(`${API_BASE}/api/summary?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
  if (!res.ok) throw new Error("Failed to load summary")
  return res.json()
}

export async function fetchDayAhead(date, cutoffHour = 11, cutoffMinute = 0) {
  const res = await fetch(`${API_BASE}/api/day-ahead?date=${date}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
  if (!res.ok) throw new Error("Failed to load day-ahead data")
  return res.json()
}

export async function fetchErrorDistribution(cutoffHour = 11, cutoffMinute = 0) {
  const res = await fetch(`${API_BASE}/api/analytics/error-distribution?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
  if (!res.ok) throw new Error("Failed to load error distribution")
  return res.json()
}

export async function fetchHourlyProfile(cutoffHour = 11, cutoffMinute = 0) {
  const res = await fetch(`${API_BASE}/api/analytics/hourly-profile?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`)
  if (!res.ok) throw new Error("Failed to load hourly profile")
  return res.json()
}

export async function fetchForecastEvolution(targetTime) {
  const res = await fetch(`${API_BASE}/api/forecast-evolution?target_time=${encodeURIComponent(targetTime)}`)
  if (!res.ok) throw new Error("Failed to load forecast evolution")
  return res.json()
}

export async function fetchProcurementSimulation(date, baseDemand = 28000, confidenceLevel = 0.90, cutoffHour = 11, cutoffMinute = 0) {
  const url = `${API_BASE}/api/simulation/procurement?date=${date}&base_demand=${baseDemand}&confidence_level=${confidenceLevel}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load procurement simulation")
  return res.json()
}

export async function triggerSync() {
  const res = await fetch(`${API_BASE}/api/sync`, { method: "POST" })
  if (!res.ok) throw new Error("Sync failed")
  return res.json()
}
