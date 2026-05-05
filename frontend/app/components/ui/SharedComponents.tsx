// Shared UI Components for consistent styling across the app

import { ReactNode, IconBase } from 'react'
import type { IconProps } from 'phosphor-react'

// Type for Phosphor icons
type PhosphorIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>

// Section Header - Consistent title styling
export function SectionHeader({ 
  title, 
  icon: Icon,
  action 
}: { 
  title: string
  icon?: PhosphorIcon
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-cyan-400" />}
        {title}
      </h2>
      {action}
    </div>
  )
}

//kpi for the charts - Consistent KPI styling
export function StatKPI({ 
  label, 
  value, 
  subValue,
  color = '#00FFFF' 
}: { 
  label: string
  value: string | number
  subValue?: string
  color?: string
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color, textShadow: `0 0 10px ${color}50` }}>
        {value}
      </p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  )
}

// Chart Card - Consistent card wrapper for all visualizations
export function ChartCard({ 
  title, 
  icon: Icon,
  children,
  className = ''
}: { 
  title: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
        {title}
      </h3>
      {children}
    </div>
  )
}

// Filter Slicer - Consistent filter dropdown
export function FilterSlicer({ 
  label, 
  values, 
  selected, 
  onChange 
}: { 
  label: string
  values: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          selected.length > 0 
            ? 'bg-cyan-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        <span>{label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${selected.length > 0 ? 'bg-white/20' : 'bg-gray-600'}`}>
          {selected.length > 0 ? selected.length : 'All'}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-30 overflow-auto max-h-48">
          <div className="p-2">
            {values.slice(0, 20).map((value: string) => (
              <label key={String(value)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1.5 rounded-lg">
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
                  className="w-3.5 h-3.5 rounded bg-gray-700 border-gray-500 text-cyan-400"
                />
                <span className="text-xs text-gray-300 truncate">{String(value)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Data Table - Consistent table styling
export function DataTable({ 
  columns, 
  rows 
}: { 
  columns: string[]
  rows: any[][]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {columns.map((col, idx) => (
              <th key={idx} className="text-left py-2 px-3 text-gray-400 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="py-2 px-3 text-gray-300">
                  {String(cell ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Inline Alert - Consistent message styling
export function InlineAlert({ 
  type = 'info', 
  message 
}: { 
  type?: 'info' | 'success' | 'warning' | 'error'
  message: string
}) {
  const colors = {
    info: 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300',
    success: 'bg-green-500/10 border-green-500/50 text-green-300',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300',
    error: 'bg-red-500/10 border-red-500/50 text-red-300',
  }
  
  return (
    <div className={`p-3 rounded-lg border ${colors[type]}`}>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// Prompt Panel - Consistent query/insights input
export function PromptPanel({ 
  placeholder,
  value,
  onChange,
  onSubmit,
  loading,
  submitLabel
}: { 
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading?: boolean
  submitLabel?: string
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      <button
        onClick={onSubmit}
        disabled={!value || loading}
        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
      >
        {loading ? 'Running...' : submitLabel || 'Run'}
      </button>
    </div>
  )
}

// Action Bar - Consistent action buttons
export function ActionBar({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  )
}

// Import useState for FilterSlicer
import { useState } from 'react'
