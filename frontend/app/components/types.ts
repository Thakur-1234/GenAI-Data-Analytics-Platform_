// Shared types for the application

export interface ColumnInfo {
  name: string
  dtype: string
  semantic_type: string
  null_count: number
  unique_count: number
}

export interface DataInfo {
  session_id: string
  filename: string
  shape: number[]
  columns: ColumnInfo[]
  numeric_columns: string[]
  categorical_columns: string[]
  sample_data: Record<string, unknown>[]
}

export interface Metric {
  label: string
  value: number
  format: string
}

// LLM-driven dashboard types (ZERO local heuristics)
export interface LLMetric {
  id: string
  label: string
  value: number | null
  format: string
  color: string | null
}

export interface LLVizFilter {
  id: string
  column: string
  label: string
  pandas_code: string
}

export interface LLVisualization {
  id: string
  type: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar' | 'heatmap' | 'horizontal_bar' | 'stacked_bar' | 'histogram' | 'box'
  title: string
  x: string | null
  y: string | string[] | null
  group_by?: string
  aggregation?: string
  limit?: number
  data: any[] | {
    data: any[]
    layout?: any
  }
  options: Record<string, any>
}

export interface LLDashboardSpec {
  title: string
  description: string
  metrics: LLMetric[]
  visualizations: LLVisualization[]
  filters: LLVizFilter[]
  layout?: {
    type: string
    columns: string[]
  }
}

export interface LLDashboardData {
  title: string
  description: string
  metrics: LLMetric[]
  visualizations: LLVisualization[]
  filters: LLVizFilter[]
  errors: string[]
}

export interface LLDashboardResponse {
  spec: LLDashboardSpec
  data: LLDashboardData
}

export interface Visualization {
  type: string
  title: string
  x?: string
  y?: string | string[]
  values?: number[]
  labels?: string[]
  data?: any[] | {
    data: any[]
    layout?: any
  }
}

export interface Insights {
  summary: string
  key_insights: string[]
  statistics: Record<string, unknown>
}

export interface TableResult {
  columns: string[]
  rows: any[][]
}

export interface QueryResult {
  query: {
    original: string
    interpretation: string
  }
  code: {
    pandas: string
    status: string
  }
  results: {
    data: string | TableResult
    summary: string
    type: string
  }
  metadata: {
    timestamp: string
    rows_affected: number | null
  }
  error?: string | null
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

// Neon color palette for LLM dashboard
export const NEON_COLORS = [
  '#00FFFF', // cyan
  '#FF00FF', // magenta
  '#39FF14', // lime
  '#FFFF00', // yellow
  '#00CED1', // teal
  '#FF6B00', // orange
  '#BF00FF', // purple
  '#FF1493', // pink
  '#FF3131', // red
  '#0080FF', // blue
]
