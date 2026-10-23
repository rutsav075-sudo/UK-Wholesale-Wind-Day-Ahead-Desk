import React, { useState, useEffect } from "react"
import {
  Activity,
  Zap,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  Shield,
  HelpCircle
} from "lucide-react"

import Header from "./components/Header"
import MetricCard from "./components/MetricCard"
import DayAheadChart from "./components/DayAheadChart"
import ErrorDistributionChart from "./components/ErrorDistributionChart"
import HourlyProfileChart from "./components/HourlyProfileChart"
import ThermalProcurementCalculator from "./components/ThermalProcurementCalculator"
import ForecastEvolutionChart from "./components/ForecastEvolutionChart"
import PerformanceTable from "./components/PerformanceTable"

import {
  fetchDates,
  fetchSummary,
  fetchDayAhead,
  fetchErrorDistribution,
  fetchHourlyProfile,
  fetchForecastEvolution,
  fetchProcurementSimulation,
  triggerSync
} from "./services/api"

export default function App() {
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState("2026-01-05")
  const [cutoffHour, setCutoffHour] = useState(11)
  const [viewMode, setViewMode] = useState("half-hour")
  const [activeTab, setActiveTab] = useState("trading")

  const [dayData, setDayData] = useState(null)
  const [monthSummary, setMonthSummary] = useState(null)
  const [errorDist, setErrorDist] = useState(null)
  const [hourlyProfile, setHourlyProfile] = useState([])

  const [simBaseDemand, setSimBaseDemand] = useState(28000)
  const [simConfidence, setSimConfidence] = useState(0.90)
  const [simData, setSimData] = useState(null)

  const [selectedPeriodTime, setSelectedPeriodTime] = useState("2026-01-05T12:00:00Z")
  const [evolutionData, setEvolutionData] = useState(null)

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const dateRes = await fetchDates()
        setDates(dateRes.dates || [])
        if (dateRes.dates && dateRes.dates.length > 0) {
          const defaultDate = dateRes.dates.includes("2026-01-05") ? "2026-01-05" : dateRes.dates[0]
          setSelectedDate(defaultDate)
        }
      } catch (err) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedDate) return

    async function loadDayAndGlobal() {
      try {
        setLoading(true)
        const [dayRes, summRes, distRes, profileRes] = await Promise.all([
          fetchDayAhead(selectedDate, cutoffHour, 0),
          fetchSummary(cutoffHour, 0),
          fetchErrorDistribution(cutoffHour, 0),
          fetchHourlyProfile(cutoffHour, 0)
        ])
        setDayData(dayRes)
        setMonthSummary(summRes)
        setErrorDist(distRes)
        setHourlyProfile(profileRes.profile || [])

        if (dayRes.records && dayRes.records.length > 0) {
          const defaultTarget = dayRes.records[24]?.startTime || dayRes.records[0].startTime
          setSelectedPeriodTime(defaultTarget)
        }
      } catch (err) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadDayAndGlobal()
  }, [selectedDate, cutoffHour])

  useEffect(() => {
    if (!selectedDate) return
    async function loadSimulation() {
      try {
        const simRes = await fetchProcurementSimulation(selectedDate, simBaseDemand, simConfidence, cutoffHour, 0)
        setSimData(simRes)
      } catch (err) {
        console.error(err)
      }
    }
    loadSimulation()
  }, [selectedDate, simBaseDemand, simConfidence, cutoffHour])

  useEffect(() => {
    if (!selectedPeriodTime) return
    async function loadEvolution() {
      try {
        const evoRes = await fetchForecastEvolution(selectedPeriodTime)
        setEvolutionData(evoRes)
      } catch (err) {
        console.error(err)
      }
    }
    loadEvolution()
  }, [selectedPeriodTime])

  const handleSync = async () => {
    try {
      setSyncing(true)
      await triggerSync()
      const dayRes = await fetchDayAhead(selectedDate, cutoffHour, 0)
      setDayData(dayRes)
    } catch (err) {
      alert("Sync error: " + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleSelectPeriod = (period) => {
    if (period && period.startTime) {
      setSelectedPeriodTime(period.startTime)
      if (activeTab === "trading") {
        setActiveTab("evolution")
      }
    }
  }

  const metrics = dayData?.metrics || {}
  const overall = monthSummary?.overall || {}

  return (
    <div className="app-container">
      <Header
        dates={dates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cutoffHour={cutoffHour}
        onCutoffChange={setCutoffHour}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSync={handleSync}
        syncing={syncing}
      />

      <nav className="nav-tabs">
        <button
          id="tab-trading"
          className={`nav-tab-btn ${activeTab === "trading" ? "active" : ""}`}
          onClick={() => setActiveTab("trading")}
        >
          <TrendingUp size={15} /> Day-Ahead Desk
        </button>
        <button
          id="tab-analytics"
          className={`nav-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={15} /> Quantitative Accuracy
        </button>
        <button
          id="tab-procurement"
          className={`nav-tab-btn ${activeTab === "procurement" ? "active" : ""}`}
          onClick={() => setActiveTab("procurement")}
        >
          <Zap size={15} /> Thermal Plant Hedge Tool
        </button>
        <button
          id="tab-evolution"
          className={`nav-tab-btn ${activeTab === "evolution" ? "active" : ""}`}
          onClick={() => setActiveTab("evolution")}
        >
          <Layers size={15} /> Forecast Evolution
        </button>
        <button
          id="tab-performance"
          className={`nav-tab-btn ${activeTab === "performance" ? "active" : ""}`}
          onClick={() => setActiveTab("performance")}
        >
          <Calendar size={15} /> January 2026 Audit
        </button>
      </nav>

      <section className="metrics-grid">
        <MetricCard
          label="Mean Absolute Error (MAE)"
          value={metrics.mae ? metrics.mae.toLocaleString() : "-"}
          unit="MW"
          subtext={`Monthly Average: ${overall.mae ? overall.mae.toLocaleString() : "-"} MW`}
          icon={Activity}
          accentColor="var(--accent-cyan)"
          badgeText={metrics.wape ? `${metrics.wape}% WAPE` : undefined}
          badgeType={metrics.wape < 15 ? "positive" : "warning"}
        />
        <MetricCard
          label="Root Mean Square Error (RMSE)"
          value={metrics.rmse ? metrics.rmse.toLocaleString() : "-"}
          unit="MW"
          subtext={`Jan 2026 Aggregate: ${overall.rmse ? overall.rmse.toLocaleString() : "-"} MW`}
          icon={AlertCircle}
          accentColor="var(--accent-rose)"
          badgeText="Penalty Volatility"
          badgeType="neutral"
        />
        <MetricCard
          label="Forecast Bias (DA - Actual)"
          value={metrics.bias ? (metrics.bias > 0 ? `+${metrics.bias.toLocaleString()}` : metrics.bias.toLocaleString()) : "-"}
          unit="MW"
          subtext={metrics.bias > 0 ? "Tendency to Over-Forecast" : "Tendency to Under-Forecast"}
          icon={TrendingUp}
          accentColor={metrics.bias > 0 ? "var(--accent-amber)" : "var(--accent-emerald)"}
          badgeText={metrics.overForecastRatio ? `${metrics.overForecastRatio}% Over` : undefined}
          badgeType={metrics.overForecastRatio > 60 ? "warning" : "positive"}
        />
        <MetricCard
          label="Forecast Correlation (r)"
          value={metrics.correlation ? metrics.correlation : "-"}
          unit=""
          subtext="Correlation with Met Office / Elexon actuals"
          icon={BarChart3}
          accentColor="var(--accent-purple)"
          badgeText="Pattern Tracking"
          badgeType="positive"
        />
        <MetricCard
          label="Thermal Procurement Buffer"
          value={simData?.recommendedBufferMW ? `+${simData.recommendedBufferMW.toLocaleString()}` : "-"}
          unit="MW"
          subtext={`At ${(simConfidence * 100).toFixed(0)}% Confidence Level`}
          icon={Shield}
          accentColor="var(--accent-amber)"
          badgeText="P90 Risk Hedge"
          badgeType="warning"
        />
      </section>

      {activeTab === "trading" && (
        <>
          <DayAheadChart
            records={dayData?.records || []}
            viewMode={viewMode}
            onSelectPeriod={handleSelectPeriod}
            selectedPeriod={selectedPeriodTime}
          />

          <ThermalProcurementCalculator
            simData={simData}
            baseDemand={simBaseDemand}
            onBaseDemandChange={setSimBaseDemand}
            confidenceLevel={simConfidence}
            onConfidenceChange={setSimConfidence}
          />
        </>
      )}

      {activeTab === "analytics" && (
        <>
          <div className="grid-2col">
            <ErrorDistributionChart distribution={errorDist} />
            <HourlyProfileChart profile={hourlyProfile} />
          </div>

          <PerformanceTable
            dailyStats={monthSummary?.daily || []}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setActiveTab("trading")
            }}
            selectedDate={selectedDate}
          />
        </>
      )}

      {activeTab === "procurement" && (
        <ThermalProcurementCalculator
          simData={simData}
          baseDemand={simBaseDemand}
          onBaseDemandChange={setSimBaseDemand}
          confidenceLevel={simConfidence}
          onConfidenceChange={setSimConfidence}
        />
      )}

      {activeTab === "evolution" && (
        <ForecastEvolutionChart
          evolutionData={evolutionData}
          targetTime={selectedPeriodTime}
        />
      )}

      {activeTab === "performance" && (
        <PerformanceTable
          dailyStats={monthSummary?.daily || []}
          onSelectDate={(date) => {
            setSelectedDate(date)
            setActiveTab("trading")
          }}
          selectedDate={selectedDate}
        />
      )}
    </div>
  )
}
