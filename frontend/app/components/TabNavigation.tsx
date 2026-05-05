'use client'

import { FileCsv, ChartBar, Sparkle, ChatCircleDots } from 'phosphor-react'

type TabType = 'overview' | 'visualizations' | 'insights' | 'query'

interface TabNavigationProps {
  activeTab: TabType
  sessionId: string | null
  onTabChange: (tab: TabType) => void
  onOpenQuery: () => void
}

export default function TabNavigation({
  activeTab,
  sessionId,
  onTabChange,
  onOpenQuery
}: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FileCsv className="w-4 h-4" /> },
    { id: 'visualizations', label: 'Visualizations', icon: <ChartBar className="w-4 h-4" /> },
    { id: 'insights', label: 'AI Insights', icon: <Sparkle className="w-4 h-4" /> },
    { id: 'query', label: 'Query', icon: <ChatCircleDots className="w-4 h-4" /> },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border p-2 mb-6">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={!sessionId && tab.id !== 'overview'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        
        <div className="flex-1" />
        
        <button
          onClick={onOpenQuery}
          disabled={!sessionId}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChatCircleDots className="w-4 h-4" />
          Query Your Data
        </button>
      </div>
    </div>
  )
}
