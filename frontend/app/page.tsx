'use client'

import { useState, useEffect } from 'react'
import { 
  SquaresFour, ChartBar, Lightbulb, MagnifyingGlass,
  X, HardDrives, ArrowClockwise
} from 'phosphor-react'
import ConfigPanel from './components/ConfigPanel'
import VisualizationsTab from './components/VisualizationsTab'
import OverviewTab from './components/OverviewTab'
import InsightsTab from './components/InsightsTab'
import EmptyState from './components/EmptyState'
import { ThemeProvider, useTheme } from './components/ThemeProvider'
import { DataInfo, Insights, QueryResult, LLDashboardResponse } from './components/types'
import { ChartCard, SectionHeader, PromptPanel, InlineAlert } from './components/ui/SharedComponents'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type TabType = 'overview' | 'visualizations' | 'insights' | 'query'

function HomeContent() {
  const { theme, toggleTheme } = useTheme()
  const [file, setFile] = useState<File | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null)
  const [llmDashboard, setLlmDashboard] = useState<LLDashboardResponse | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [queryLoading, setQueryLoading] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadFile = async () => {
    if (!file) return
    
    setLoading(true)
    setDashboardError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to upload file: ${errorText}`)
      }
      
      const data = await response.json()
      const newSessionId = data.session_id
      
      setSessionId(newSessionId)
      setDataInfo({
        session_id: newSessionId,
        filename: data.filename,
        shape: data.shape,
        columns: data.columns,
        numeric_columns: data.numeric_columns,
        categorical_columns: data.categorical_columns,
        sample_data: data.sample_data
      })

      // Load LLM dashboard directly with the new session ID
      await loadLLMDashboardDirect(newSessionId)
      
      // Generate AI insights
      await generateInsightsDirect(newSessionId)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      const message = error instanceof Error ? error.message : String(error)
      alert(`Upload failed: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadLLMDashboardDirect = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sample-visualizations/${sid}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }
      
      const data = await response.json()
      setLlmDashboard(data)
      setActiveTab('visualizations')
    } catch (error) {
      console.error('Error loading LLM dashboard:', error)
      setDashboardError(error instanceof Error ? error.message : 'Failed to generate dashboard')
    }
  }

  const generateInsightsDirect = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid })
      })
      
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    }
  }

  const handleQuery = async () => {
    if (!sessionId || !query) return

    setQueryLoading(true)
    setQueryResult(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, query: query.trim() }),
      })

      const raw = await res.text()
      let data: any = null
      try { data = JSON.parse(raw) } catch { data = { error: raw } }

      if (!res.ok) throw new Error(data?.error || 'Query failed')

      setQueryResult({
        query: {
          original: data.query?.original || query,
          interpretation: data.query?.interpretation || ''
        },
        code: {
          pandas: data.code?.pandas || '',
          status: data.code?.status || 'unknown'
        },
        results: {
          data: data.results?.data || '',
          summary: data.results?.summary || '',
          type: data.results?.type || 'text'
        },
        metadata: {
          timestamp: data.metadata?.timestamp || new Date().toISOString(),
          rows_affected: data.metadata?.rows_affected || null
        },
        error: data.error,
      })
    } catch (err) {
      setQueryResult({
        query: {
          original: query,
          interpretation: 'Failed to process query'
        },
        code: {
          pandas: '',
          status: 'error'
        },
        results: {
          data: '',
          summary: '',
          type: 'error'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          rows_affected: null
        },
        error: err instanceof Error ? err.message : 'Query failed',
      })
    } finally {
      setQueryLoading(false)
    }
  }

  const clearData = () => {
    setFile(null)
    setSessionId(null)
    setDataInfo(null)
    setLlmDashboard(null)
    setInsights(null)
    setQueryResult(null)
    setActiveTab('overview')
  }

  const refreshDashboard = async () => {
    if (sessionId) {
      await loadLLMDashboardDirect(sessionId)
    }
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: SquaresFour },
    { id: 'visualizations' as const, label: 'Dashboard', icon: ChartBar },
    { id: 'insights' as const, label: 'Insights', icon: Lightbulb },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ConfigPanel
        file={file}
        loading={loading}
        onFileChange={handleFileChange}
        onUpload={uploadFile}
      />

      <div className="w-full px-2 sm:px-4 py-2 sm:py-4">
        {dataInfo ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 w-full sm:w-auto overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0
                        ${isActive 
                          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700 flex-shrink-0">
                  <HardDrives className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-300 whitespace-nowrap">
                    {dataInfo.shape?.[0]?.toLocaleString() || 0} × {dataInfo.shape?.[1] || 0}
                  </span>
                </div>

                <button
                  onClick={refreshDashboard}
                  disabled={loading}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-50 flex-shrink-0"
                  title="Refresh"
                >
                  <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={clearData}
                  className="p-2 bg-gray-800/50 hover:bg-red-500/20 rounded-lg border border-gray-700 text-gray-400 hover:text-red-400 transition-all flex-shrink-0"
                  title="Clear data"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="min-h-[400px] sm:min-h-[600px]">
              {activeTab === 'overview' && <OverviewTab dataInfo={dataInfo} />}
              
              {activeTab === 'visualizations' && (
                dashboardError ? (
                  <ChartCard title="Dashboard Error" icon={ChartBar}>
                    <InlineAlert type="error" message={dashboardError} />
                    <button
                      onClick={refreshDashboard}
                      className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg"
                    >
                      Retry
                    </button>
                  </ChartCard>
                ) : (
                  <VisualizationsTab
                    llmDashboard={llmDashboard}
                    dataInfo={dataInfo}
                    loading={loading}
                    onRefresh={refreshDashboard}
                  />
                )
              )}
              
              {activeTab === 'insights' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Query Panel */}
                  <ChartCard title="Ask Questions" icon={MagnifyingGlass}>
                    <div className="space-y-3">
                      <PromptPanel
                        placeholder="Ask about your data..."
                        value={query}
                        onChange={setQuery}
                        onSubmit={handleQuery}
                        loading={queryLoading}
                        submitLabel="Ask"
                      />
                      {queryResult && !queryResult.error && queryResult.results?.summary && (
                        <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/30">
                          <p className="text-gray-300 text-sm">{queryResult.results.summary}</p>
                        </div>
                      )}
                      {queryResult?.error && (
                        <InlineAlert type="error" message={queryResult.error} />
                      )}
                    </div>
                  </ChartCard>
                  
                  {/* Insights Panel */}
                  {insights ? (
                    <InsightsTab insights={insights} />
                  ) : (
                    <ChartCard title="AI Insights" icon={Lightbulb}>
                      <div className="text-center py-8">
                        <InlineAlert type="info" message="Generate AI-powered insights from your data" />
                        <button
                          onClick={() => sessionId && generateInsightsDirect(sessionId)}
                          disabled={insightsLoading}
                          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
                        >
                          {insightsLoading ? <ArrowClockwise className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                          {insightsLoading ? 'Analyzing...' : 'Generate Insights'}
                        </button>
                      </div>
                    </ChartCard>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  )
}

// Wrap with ThemeProvider
export default function Home() {
  return (
    <ThemeProvider defaultPreference="system">
      <HomeContent />
    </ThemeProvider>
  )
}
