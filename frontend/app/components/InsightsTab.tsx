'use client'

import { Lightbulb, File, TrendUp, ChartBar } from 'phosphor-react'
import { Insights } from './types'
import { ChartCard, SectionHeader, StatKPI } from './ui/SharedComponents'

interface InsightsTabProps {
  insights: Insights
}

export default function InsightsTab({ insights }: InsightsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Summary - Highlighted */}
      <div className="md:col-span-12">
        <div className="bg-gradient-to-r from-purple-600/80 to-cyan-600/80 rounded-xl p-5 border border-purple-500/50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">AI Summary</h3>
          </div>
          <p className="text-purple-100 text-base leading-relaxed">{insights.summary}</p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="md:col-span-12">
        <SectionHeader title="Key Insights" icon={TrendUp} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.key_insights?.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors">
              <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <p className="text-gray-300 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {insights.statistics && Object.keys(insights.statistics).length > 0 && (
        <div className="md:col-span-12">
          <SectionHeader title="Statistics" icon={ChartBar} />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(insights.statistics).slice(0, 12).map(([key, value], idx) => {
              const color = ['#00FFFF', '#FF00FF', '#39FF14', '#FFFF00', '#00CED1', '#FF6B00'][idx % 6]
              return (
                <StatKPI 
                  key={idx}
                  label={String(key).replace(/_/g, ' ')} 
                  value={typeof value === 'number' ? value.toLocaleString() : String(value).slice(0, 20)}
                  color={color}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
