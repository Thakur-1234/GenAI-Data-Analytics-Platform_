'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  Funnel, ChartBar, ChartPie, ChartLine, TrendUp, 
  ArrowClockwise, Activity, Circle, Globe, Stack, X, 
  Export, FileCsv, FileXls, Cloud
} from 'phosphor-react'
import { DataInfo, LLDashboardResponse, LLVizFilter, LLVisualization, LLMetric } from './types'
import { useTheme, useChartTheme } from './ThemeProvider'
import dynamic from 'next/dynamic'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

import { ChartCard, SectionHeader, StatKPI } from './ui/SharedComponents'
import BIConnectionModal from './BIConnectionModal'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Professional Business Intelligence Color Palette
const BI_COLORS = {
  // Primary - Professional Blues
  primaryBlue: '#1E3A8A',      // Deep professional blue
  lightBlue: '#3B82F6',         // Bright professional blue
  
  // Secondary - Accent Colors
  emerald: '#10B981',           // Success/positive
  red: '#EF4444',               // Warning/negative
  amber: '#F59E0B',             // Caution
  
  // Neon Accents for charts
  cyan: '#06B6D4',              // Cyan accent
  teal: '#14B8A6',              // Teal
  sky: '#0EA5E9',               // Sky blue
  purple: '#A855F7',            // Purple
  pink: '#EC4899',              // Pink
  orange: '#F97316',            // Orange
}

// Optimized chart colors for BI dashboards
const CHART_COLORS = [
  BI_COLORS.cyan,
  BI_COLORS.emerald,
  BI_COLORS.purple,
  BI_COLORS.orange,
  BI_COLORS.sky,
  BI_COLORS.teal,
  BI_COLORS.pink,
  BI_COLORS.lightBlue,
  BI_COLORS.amber,
  BI_COLORS.red,
]

interface VisualizationsTabProps {
  llmDashboard: LLDashboardResponse | null
  dataInfo: DataInfo | null
  loading: boolean
  onRefresh: () => void
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-xl">
        <p className="font-bold text-white text-sm mb-1">{label || 'Value'}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color || entry.stroke }}>
            {entry.name}: <span className="text-gray-300">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Enhanced KPI Card Component with BI Focus
const KPICard = ({ label, value, color, format }: { label: string; value: number | null; color: string; format: string }) => {
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return '-'
    if (format === 'currency') return `$${(value/1000).toFixed(1)}K`
    if (format === 'percent') return `${value.toFixed(1)}%`
    if (value > 1000000) return `${(value/1000000).toFixed(1)}M`
    if (value > 1000) return `${(value/1000).toFixed(1)}K`
    return value.toLocaleString()
  }, [value, format])

  // Determine trend indicator (mock - can be enhanced with actual trend data)
  const getTrendColor = () => {
    if (format === 'percent' && value && value > 50) return BI_COLORS.emerald
    return BI_COLORS.lightBlue
  }

  return (
    <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-500 transition-all duration-300 overflow-hidden">
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/0 to-gray-600/0 group-hover:from-gray-700/20 group-hover:to-gray-600/20 transition-all duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Label with icon dot */}
        <div className="flex items-center gap-2 mb-3">
          <div 
            className="w-2 h-2 rounded-full shadow-lg" 
            style={{ backgroundColor: color }}
          />
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">{label}</span>
        </div>
        
        {/* Main value */}
        <div className="text-2xl font-bold text-white mb-2">{formattedValue}</div>
        
        {/* Trend indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <div 
            className="w-1.5 h-1.5 rounded-full" 
            style={{ backgroundColor: getTrendColor() }}
          />
          <span style={{ color: getTrendColor() }} className="font-medium">Active</span>
        </div>
      </div>
    </div>
  )
}

// Enhanced Dynamic Chart Renderer
const DynamicChart = ({ visualization, colors }: { visualization: any; colors: string[] }) => {
  const { type, title, data } = visualization
  const [isPlotlyLoaded, setIsPlotlyLoaded] = useState(false)
  const [chartColors, setChartColors] = useState({
    gridColor: 'rgba(51, 65, 85, 0.5)',
    axisColor: '#64748b',
    tooltipBg: '#1e293b',
    tooltipText: '#f8fafc',
    legendColor: '#94a3b8',
    fontColor: '#e2e8f0'
  })
  
  useEffect(() => {
    // Get theme colors from CSS variables
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      setChartColors({
        gridColor: 'rgba(51, 65, 85, 0.5)',
        axisColor: '#64748b',
        tooltipBg: '#1e293b',
        tooltipText: '#f8fafc',
        legendColor: '#94a3b8',
        fontColor: '#e2e8f0'
      })
    } else {
      setChartColors({
        gridColor: 'rgba(209, 213, 219, 0.5)',
        axisColor: '#9ca3af',
        tooltipBg: '#ffffff',
        tooltipText: '#111827',
        legendColor: '#6b7280',
        fontColor: '#374151'
      })
    }
    
    // Check if Plotly is loaded
    const checkPlotly = () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.Plotly || document.querySelector('.plotly-graph-div')) {
          setIsPlotlyLoaded(true)
        }
      }
    }
    checkPlotly()
    // Set a timeout to show fallback after 3 seconds
    const timer = setTimeout(() => setIsPlotlyLoaded(true), 3000)
    return () => clearTimeout(timer)
  }, [])
  
  useEffect(() => {
    // Check if Plotly is loaded
    const checkPlotly = () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.Plotly || document.querySelector('.plotly-graph-div')) {
          setIsPlotlyLoaded(true)
        }
      }
    }
    checkPlotly()
    // Set a timeout to show fallback after 3 seconds
    const timer = setTimeout(() => setIsPlotlyLoaded(true), 3000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400">
        <span className="text-sm">No data available</span>
      </div>
    )
  }

  // Handle different data formats - Plotly expects data and layout properties
  let plotData = []
  let plotLayout = {}
  
  if (Array.isArray(data)) {
    // If data is an array, treat it as Plotly traces directly
    plotData = data
  } else if (data && typeof data === 'object') {
    // If data is an object with data/layout properties
    plotData = data.data || []
    plotLayout = data.layout || {}
  }
  
  // Check if we have valid data to render
  if (!plotData || plotData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400">
        <span className="text-sm">No chart data</span>
      </div>
    )
  }

  return (
    <div className="w-full h-full" style={{ minHeight: '200px' }}>
      <Plot
        data={plotData}
        layout={{
          autosize: true,
          width: undefined,
          height: undefined,
          ...plotLayout,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: chartColors.fontColor, family: '-apple-system, BlinkMacSystemFont, "Segoe UI"' },
          margin: { t: 20, r: 15, b: 25, l: 45 },
          showlegend: true,
          legend: { 
            x: 0.01, 
            y: 0.99, 
            bgcolor: chartColors.tooltipBg,
            bordercolor: chartColors.gridColor,
            borderwidth: 1,
            font: { size: 12, color: chartColors.legendColor },
            xanchor: 'left',
            yanchor: 'top'
          },
          hovermode: 'closest',
          xaxis: {
            gridcolor: chartColors.gridColor,
            linecolor: chartColors.axisColor,
            tickcolor: chartColors.axisColor,
            tickfont: { color: chartColors.axisColor }
          },
          yaxis: {
            gridcolor: chartColors.gridColor,
            linecolor: chartColors.axisColor,
            tickcolor: chartColors.axisColor,
            tickfont: { color: chartColors.axisColor }
          }
        }}
        style={{ width: '100%', height: '100%' }}
        config={{ 
          responsive: true, 
          displayModeBar: false,
          displaylogo: false,
          toImageButtonOptions: { format: 'png', filename: title }
        }}
        useResizeHandler={true}
      />
    </div>
  )
}

// Get icon for chart type (BI-focused)
const getChartIcon = (type: string) => {
  const iconClass = "w-4 h-4 sm:w-5 sm:h-5"
  switch (type) {
    case 'bar':
    case 'horizontal_bar':
      return <ChartBar className={`${iconClass} text-sky-400`} />
    case 'line':
    case 'area':
      return <ChartLine className={`${iconClass} text-emerald-400`} />
    case 'pie':
    case 'donut':
      return <ChartPie className={`${iconClass} text-purple-400`} />
    case 'radar':
      return <Circle className={`${iconClass} text-orange-400`} />
    case 'scatter':
      return <Activity className={`${iconClass} text-pink-400`} />
    case 'histogram':
      return <ChartBar className={`${iconClass} text-amber-400`} />
    case 'box':
      return <Stack className={`${iconClass} text-violet-400`} />
    case 'heatmap':
      return <TrendUp className={`${iconClass} text-cyan-400`} />
    default:
      return <TrendUp className={`${iconClass} text-sky-400`} />
  }
}

// Filter Component with BI styling
const FilterSlicer = ({ filter, selected, onChange, dataInfo }: { 
  filter: LLVizFilter; selected: string[]; onChange: (values: string[]) => void; dataInfo: DataInfo | null
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Get unique values from the original data
  const values = useMemo(() => {
    if (!dataInfo?.sample_data) return []
    const col = filter.column
    const uniqueValues = new Set(dataInfo.sample_data.map(d => String(d[col] ?? '')).filter(Boolean))
    return Array.from(uniqueValues).slice(0, 20)
  }, [filter.column, dataInfo])
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          selected.length > 0 
            ? 'bg-sky-600 text-white border border-sky-500' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
        }`}
      >
        <Funnel className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{filter.label || filter.column}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${selected.length > 0 ? 'bg-white/20' : 'bg-gray-600'}`}>
          {selected.length > 0 ? selected.length : '∀'}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-40 overflow-hidden">
          <div className="bg-gray-800/60 px-3 py-2 border-b border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Select {filter.label || filter.column}
            </p>
          </div>
          <div className="p-2 max-h-56 overflow-y-auto">
            {values.length > 0 ? (
              values.map((value: string) => (
                <label key={String(value)} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.includes(String(value))}
                    onChange={() => {
                      if (selected.includes(String(value))) {
                        onChange(selected.filter(v => v !== String(value)))
                      } else {
                        onChange([...selected, String(value)])
                      }
                    }}
                    className="w-4 h-4 rounded bg-gray-700 border border-gray-600 text-sky-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 truncate">{String(value)}</span>
                </label>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-3">No values available</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Custom Chart Modal Component
const CustomChartModal = ({
  isOpen,
  onClose,
  onCreate,
  dataInfo,
  chartType,
  setChartType,
  xColumn,
  setXColumn,
  yColumn,
  setYColumn,
  loading
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: () => void
  dataInfo: DataInfo | null
  chartType: string
  setChartType: (type: string) => void
  xColumn: string
  setXColumn: (col: string) => void
  yColumn: string
  setYColumn: (col: string) => void
  loading: boolean
}) => {
  if (!isOpen) return null
  
  const columns = dataInfo?.columns || []
  const numericColumns = dataInfo?.numeric_columns || []
  const categoricalColumns = dataInfo?.categorical_columns || []
  
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: ChartBar },
    { value: 'line', label: 'Line Chart', icon: ChartLine },
    { value: 'scatter', label: 'Scatter Plot', icon: Activity },
    { value: 'pie', label: 'Pie Chart', icon: ChartPie },
    { value: 'histogram', label: 'Histogram', icon: TrendUp },
  ]
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Create Custom Chart</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Chart Type</label>
            <div className="grid grid-cols-3 gap-2">
              {chartTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      chartType === type.value
                        ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* X Column */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">X Axis (Category)</label>
            <select
              value={xColumn}
              onChange={(e) => setXColumn(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select column...</option>
              {categoricalColumns.map((col: string) => (
                <option key={col} value={col}>{col}</option>
              ))}
              {numericColumns.map((col: string) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          
          {/* Y Column */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Y Axis (Value)</label>
            <select
              value={yColumn}
              onChange={(e) => setYColumn(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select column...</option>
              {numericColumns.map((col: string) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={!xColumn || !yColumn || loading}
            className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ArrowClockwise className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Chart'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VisualizationsTab({ llmDashboard, dataInfo, loading, onRefresh }: VisualizationsTabProps) {
  const { theme } = useTheme()
  const chartTheme = useChartTheme()
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  
  // Custom chart state
  const [showCustomChartModal, setShowCustomChartModal] = useState(false)
  const [customChartType, setCustomChartType] = useState('bar')
  const [customXColumn, setCustomXColumn] = useState('')
  const [customYColumn, setCustomYColumn] = useState('')
  const [customCharts, setCustomCharts] = useState<any[]>([])
  const [creatingChart, setCreatingChart] = useState(false)

  // Create custom chart handler
  const handleCreateCustomChart = async () => {
    if (!dataInfo?.session_id || !customXColumn || !customYColumn) return
    
    setCreatingChart(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/custom-chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: dataInfo.session_id,
          chart_type: customChartType,
          x_column: customXColumn,
          y_column: customYColumn
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomCharts([...customCharts, data])
        setShowCustomChartModal(false)
        setCustomXColumn('')
        setCustomYColumn('')
        setCustomChartType('bar')
      }
    } catch (error) {
      console.error('Error creating custom chart:', error)
      alert('Failed to create chart')
    } finally {
      setCreatingChart(false)
    }
  }

  // Export data for Power BI / Tableau
  const handleExportData = async (format: 'csv' | 'json') => {
    if (!dataInfo?.session_id) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/data/${dataInfo.session_id}`)
      const data = await response.json()
      
      if (format === 'csv') {
        // Convert sample data to CSV
        const headers = data.columns || []
        const rows = data.sample_data || []
        const csvContent = [
          headers.join(','),
          ...rows.map((row: any) => headers.map((h: string) => row[h] ?? '').join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${dataInfo.filename?.replace(/\.[^/.]+$/, '') || 'data'}_export.csv`
        link.click()
        URL.revokeObjectURL(url)
      } else {
        // JSON format
        const jsonContent = JSON.stringify({ sample_data: data.sample_data, columns: data.columns }, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${dataInfo.filename?.replace(/\.[^/.]+$/, '') || 'data'}_export.json`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    }
  }

  // Show export menu
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // BI Connection Modal
  const [showBIConnectionModal, setShowBIConnectionModal] = useState(false)
  
  // Get data from LLM dashboard
  const dashboardData = llmDashboard?.data
  const dashboardSpec = llmDashboard?.spec
  const llmMetrics = dashboardData?.metrics || []
  const llmViz = dashboardData?.visualizations || []
  const llmFilters = dashboardSpec?.filters || []

  // Show loading if still loading or no data
  if (loading || !llmDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Generating dashboard...</p>
        </div>
      </div>
    )
  }

  // Show message if no visualizations
  if (llmViz.length === 0 && llmMetrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-gray-400 mb-4">No visualizations generated</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-2 sm:p-4 md:p-6">
      {/* Professional Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:mb-6">
          {/* Title and Dataset Info */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-600 to-sky-600 rounded-lg">
                <TrendUp className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {dashboardSpec?.title || 'Business Intelligence Dashboard'}
              </h1>
            </div>
            
            {/* Dataset Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-2 sm:mt-3">
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-gray-400 text-xs">Dataset</span>
                <span className="text-white font-semibold text-xs sm:text-sm truncate">{dataInfo?.filename || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-gray-400 text-xs">Records</span>
                <span className="text-emerald-400 font-semibold text-xs sm:text-sm">{dataInfo?.shape?.[0]?.toLocaleString() || '-'}</span>
              </div>
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-gray-400 text-xs">Fields</span>
                <span className="text-blue-400 font-semibold text-xs sm:text-sm">{dataInfo?.shape?.[1] || '-'}</span>
              </div>
            </div>

            {/* Description */}
            {dashboardSpec?.description && (
              <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed hidden sm:block">{dashboardSpec.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-8 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap flex-1 sm:flex-none"
              >
                <Export className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>Export</span>
              </button>
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-40 overflow-hidden">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase px-2 py-1">Export for BI Tools</p>
                    <button
                      onClick={() => { handleExportData('csv'); setShowExportMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                    >
                      <FileCsv className="w-4 h-4 text-emerald-400" />
                      <span>CSV (Power BI)</span>
                    </button>
                    <button
                      onClick={() => { handleExportData('json'); setShowExportMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                    >
                      <FileXls className="w-4 h-4 text-blue-400" />
                      <span>JSON (Tableau)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCustomChartModal(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap flex-1 sm:flex-none"
            >
              <ChartBar className="w-3 sm:w-4 h-3 sm:h-4" />
              <span>Add Chart</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-lg transition-all font-medium text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-none"
            >
              <ArrowClockwise className={`w-3 sm:w-4 h-3 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {llmFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider self-center">Filters:</span>
            {llmFilters.slice(0, 4).map((filter: LLVizFilter) => (
              <FilterSlicer
                key={filter.id}
                filter={filter}
                selected={filters[filter.id] || []}
                onChange={(values) => setFilters(prev => ({ ...prev, [filter.id]: values }))}
                dataInfo={dataInfo}
              />
            ))}
          </div>
        )}
      </div>

      {/* KPI Section */}
      {llmMetrics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
            {llmMetrics.map((metric: LLMetric, idx: number) => (
              <KPICard 
                key={metric.id || idx}
                label={metric.label} 
                value={metric.value} 
                color={metric.color || CHART_COLORS[idx % CHART_COLORS.length]}
                format={metric.format || 'number'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visualizations Section */}
      {llmViz.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ChartBar className="w-5 h-5 text-sky-400" />
            Visualizations & Insights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
            {/* Auto-generated visualizations */}
            {llmViz.map((viz: LLVisualization, idx: number) => {
              let heightClass = 'h-80'
              let spanClass = ''
              
              if (viz.type === 'line' || viz.type === 'area') {
                heightClass = 'h-96'
                spanClass = 'md:col-span-2 xl:col-span-2'
              } else if (viz.type === 'pie' || viz.type === 'donut' || viz.type === 'radar') {
                heightClass = 'h-80'
                spanClass = 'md:col-span-1'
              } else if (viz.type === 'heatmap') {
                heightClass = 'h-96'
                spanClass = 'md:col-span-2 xl:col-span-2'
              } else if (viz.type === 'histogram') {
                heightClass = 'h-80'
                spanClass = 'md:col-span-1'
              } else if (viz.type === 'box') {
                heightClass = 'h-80'
                spanClass = 'md:col-span-1'
              } else if (viz.type === 'scatter') {
                heightClass = 'h-80'
                spanClass = 'md:col-span-2 xl:col-span-1'
              }
              
              return (
                <div 
                  key={viz.id || idx} 
                  className={`${spanClass} group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10`}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      {getChartIcon(viz.type)}
                      <h3 className="text-sm font-semibold text-white flex-1 truncate">
                        {viz.title}
                      </h3>
                      <div className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400 font-medium uppercase tracking-wider">
                        {viz.type}
                      </div>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className={`${heightClass} min-h-[200px] w-full relative bg-gradient-to-br from-gray-900/50 to-gray-800/30`}>
                    <div className="absolute inset-0 p-2">
                      <DynamicChart 
                        visualization={viz} 
                        colors={CHART_COLORS}
                      />
                    </div>
                  </div>

                  {/* Footer Badge */}
                  <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Data Visualization</span>
                    <span className="text-gray-600">Plotly Interactive</span>
                  </div>
                </div>
              )
            })}
            
            {/* Custom charts */}
            {customCharts.map((chart, idx) => (
              <div 
                key={`custom-${idx}`} 
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-emerald-700/50 overflow-hidden transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    {getChartIcon(chart.type)}
                    <h3 className="text-sm font-semibold text-white flex-1 truncate">
                      {chart.title}
                    </h3>
                    <div className="text-xs px-2 py-1 bg-emerald-900/50 rounded text-emerald-400 font-medium uppercase tracking-wider">
                      Custom
                    </div>
                    <button
                      onClick={() => setCustomCharts(customCharts.filter((_, i) => i !== idx))}
                      className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove chart"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="h-80 min-h-[200px] w-full relative bg-gradient-to-br from-gray-900/50 to-gray-800/30">
                  <div className="absolute inset-0 p-2">
                    <DynamicChart 
                      visualization={{...chart, id: `custom-${idx}`}} 
                      colors={CHART_COLORS}
                    />
                  </div>
                </div>

                {/* Footer Badge */}
                <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700 flex items-center justify-between text-xs">
                  <span className="text-emerald-500">Custom Chart</span>
                  <span className="text-gray-600">{chart.columns?.x} vs {chart.columns?.y}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {llmMetrics.length === 0 && llmViz.length === 0 && (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center p-8 bg-gray-800/50 rounded-xl border border-gray-700">
            <TrendUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4 font-medium">No visualizations generated</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-sm font-medium"
            >
              Generate Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Custom Chart Modal */}
      <CustomChartModal
        isOpen={showCustomChartModal}
        onClose={() => setShowCustomChartModal(false)}
        onCreate={handleCreateCustomChart}
        dataInfo={dataInfo}
        chartType={customChartType}
        setChartType={setCustomChartType}
        xColumn={customXColumn}
        setXColumn={setCustomXColumn}
        yColumn={customYColumn}
        setYColumn={setCustomYColumn}
        loading={creatingChart}
      />
      
      {/* BI Connection Modal */}
      <BIConnectionModal
        isOpen={showBIConnectionModal}
        onClose={() => setShowBIConnectionModal(false)}
        sessionId={dataInfo?.session_id || null}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  )
}
