'use client'

import React, { useEffect, useMemo, useCallback } from 'react'
import {
  MagnifyingGlass,
  Spinner,
  ChatCircleText,
  HardDrives,
  Sparkle,
  TrendUp
} from 'phosphor-react'
import type { QueryResult } from './types'

interface QueryModalProps {
  isOpen: boolean
  query: string
  queryResult: QueryResult | null
  queryLoading: boolean
  onClose: () => void
  onQueryChange: (value: string) => void
  onExecuteQuery: () => void
}

export default function QueryModal({
  isOpen,
  query,
  queryResult,
  queryLoading,
  onClose,
  onQueryChange,
  onExecuteQuery
}: QueryModalProps) {
  if (!isOpen) return null

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onExecuteQuery()
    }
  }

  // ---------- Helpers

  const isTablePayload = (obj: any) =>
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.columns) &&
    Array.isArray(obj.rows)

  // Safe number/key-term highlighting tests (no global regex state)
  const isNumberToken = (s: string) =>
    /^[$€£]?\d+(?:,\d{3})*(?:\.\d+)?%?$/.test(s.trim())

  const isKeyTerm = (s: string) =>
    /^(true|false|null|N\/A|yes|no)$/i.test(s.trim())

  // Try to parse execution_result-like data into JS object if possible
  const parseExecutionResult = useCallback((raw: any) => {
    if (!raw) return { parsed: null as any, asString: '' }

    // If it's already an object (e.g., {columns, rows} or any dict)
    if (typeof raw === 'object') {
      try {
        return { parsed: raw, asString: JSON.stringify(raw, null, 2) }
      } catch {
        return { parsed: raw, asString: String(raw) }
      }
    }

    // Else it's a string — try JSON.parse, otherwise keep as string
    try {
      const parsed = JSON.parse(raw)
      return { parsed, asString: raw }
    } catch {
      return { parsed: null as any, asString: String(raw) }
    }
  }, [])

  // Prefer the new shape (results.data); fallback to legacy fields if any
  const rawResultData =
    // New schema (preferred)
    (queryResult as any)?.results?.data ??
    // Legacy schema fallback (string result)
    (queryResult as any)?.execution_result ??
    // Final fallback
    ''

  const { parsed: parsedResult, asString: executionAsString } = parseExecutionResult(
    rawResultData
  )

  // If backend accidentally returned {"explanation": "..."} payload
  const payloadHasExplanation =
    parsedResult &&
    typeof parsedResult === 'object' &&
    !Array.isArray(parsedResult) &&
    'explanation' in parsedResult &&
    typeof (parsedResult as any).explanation === 'string' &&
    (parsedResult as any).explanation.length > 0

  // ---------- Renderers

  const renderTabularResult = () => {
    if (isTablePayload(parsedResult)) {
      const table = parsedResult as { columns: string[]; rows: any[][] }
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 border-b">
              <tr>
                {table.columns.map((c: string, i: number) => (
                  <th key={i} className="text-left px-3 py-2 font-medium text-gray-700">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r: any[], ri: number) => (
                <tr key={ri} className="border-b last:border-0">
                  {r.map((cell: any, ci: number) => (
                    <td key={ci} className="px-3 py-2 text-gray-700">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Fallback to <pre> rendering (string or non-tabular object)
    return (
      <pre className="bg-slate-50 border-t p-4 text-xs overflow-x-auto max-h-64 whitespace-pre-wrap text-gray-700">
        {executionAsString}
      </pre>
    )
  }

  // Rich text formatter for summaries (headings, bullets, kv-pairs, highlights)
  const renderFormattedExplanation = (text: string) => {
    if (!text) return null

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) {
        elements.push(<br key={`br-${idx}`} />)
        return
      }

      // Markdown-ish headers (#, ##, ###)
      if (/^#{1,3}\s+/.test(trimmed)) {
        const headerText = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '')
        elements.push(
          <p
            key={`h-${idx}`}
            className="font-bold text-yellow-700 bg-yellow-100/70 px-3 py-1 rounded-lg inline-block mt-4 mb-2"
          >
            {headerText}
          </p>
        )
        return
      }

      // Bullets (-, *, 1.)
      const bulletMatch = trimmed.match(/^([-*]|\d+\.)\s*(.*)$/)
      if (bulletMatch) {
        const content = bulletMatch[2] || ''
        // Highlight tokens that look like numbers or key terms
        const tokens = content.split(/(\s+)/) // keep spaces
        elements.push(
          <ul key={`ul-${idx}`} className="list-disc pl-5 mb-2 text-green-900">
            <li>
              {tokens.map((t, i) =>
                isNumberToken(t) || isKeyTerm(t) ? (
                  <span
                    key={`tok-${idx}-${i}`}
                    className="font-semibold text-yellow-800 bg-yellow-200/70 px-1 rounded"
                  >
                    {t}
                  </span>
                ) : (
                  <span key={`tok-${idx}-${i}`}>{t}</span>
                )
              )}
            </li>
          </ul>
        )
        return
      }

      // Key: Value pairs (skip URLs)
      if (trimmed.includes(':') && !/https?:\/\//i.test(trimmed)) {
        const colonIndex = trimmed.indexOf(':')
        const key = trimmed.substring(0, colonIndex).trim()
        const value = trimmed.substring(colonIndex + 1).trim()

        const tokens = value.split(/(\s+)/)
        elements.push(
          <div key={`kv-${idx}`} className="flex items-start gap-2 mb-1">
            <span className="font-bold text-yellow-700">{key}:</span>
            <span className="text-green-900">
              {tokens.map((t, i) =>
                isNumberToken(t) ? (
                  <span
                    key={`kv-tok-${idx}-${i}`}
                    className="font-semibold text-yellow-800 bg-yellow-200/70 px-1 rounded"
                  >
                    {t}
                  </span>
                ) : (
                  <span key={`kv-tok-${idx}-${i}`}>{t}</span>
                )
              )}
            </span>
          </div>
        )
        return
      }

      // Regular paragraph with token highlights
      const tokens = trimmed.split(/(\s+)/)
      elements.push(
        <p key={`p-${idx}`} className="text-green-900 mb-2 leading-relaxed">
          {tokens.map((t, i) =>
            isNumberToken(t) || isKeyTerm(t) ? (
              <span
                key={`p-tok-${idx}-${i}`}
                className="font-semibold text-yellow-800 bg-yellow-200/70 px-1 rounded"
              >
                {t}
              </span>
            ) : (
              <span key={`p-tok-${idx}-${i}`}>{t}</span>
            )
          )}
        </p>
      )
    })

    return elements
  }

  const renderCompatibilityExplanation = () => {
    if (!payloadHasExplanation) return null
    const explanation = (parsedResult as any).explanation as string
    return (
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkle className="w-5 h-5" />
          <p className="font-semibold">Explanation</p>
        </div>
        <p className="text-green-100 leading-relaxed">{explanation}</p>
      </div>
    )
  }

  const renderResultWithExplanation = () => {
    const summary = (queryResult as any)?.results?.summary as string | undefined
    const rowsAffected = (queryResult as any)?.metadata?.rows_affected as number | undefined
    const interpretation = (queryResult as any)?.query?.interpretation as string | undefined
    const pandasCode = (queryResult as any)?.code?.pandas as string | undefined
    const codeStatus = (queryResult as any)?.code?.status as string | undefined

    if (!summary && !rawResultData && !pandasCode && !interpretation) return null

    return (
      <div className="space-y-4">
        {/* Query Interpretation */}
        {interpretation && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <ChatCircleText className="w-5 h-5" />
              <p className="font-semibold">Query Interpretation</p>
            </div>
            <p className="text-blue-100 leading-relaxed">{interpretation}</p>
          </div>
        )}

        {/* Pandas Code */}
        {pandasCode && (
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <HardDrives className="w-5 h-5" />
              <p className="font-semibold">Generated Code</p>
              {codeStatus && (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    codeStatus === 'executed' ? 'bg-green-500 text-green-100' : 'bg-red-500 text-red-100'
                  }`}
                >
                  {codeStatus}
                </span>
              )}
            </div>
            <pre className="bg-black/30 rounded-lg p-4 text-green-300 text-xs sm:text-sm overflow-x-auto">
              <code>{pandasCode}</code>
            </pre>
          </div>
        )}

        {/* Results */}
        {(summary || rawResultData) && (
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkle className="w-5 h-5" />
              <p className="font-semibold">Results</p>
              {typeof rowsAffected === 'number' && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs">{rowsAffected} rows</span>
              )}
            </div>

            {/* Summary/Explanation */}
            {summary && (
              <div className="mb-4">
                <div className="text-green-50 leading-relaxed">{renderFormattedExplanation(summary)}</div>
              </div>
            )}

            {/* Tabular Data */}
            {rawResultData && renderTabularResult()}
          </div>
        )}
      </div>
    )
  }

  // ---------- UI

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="query-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="query-modal-title" className="text-lg font-semibold flex items-center gap-2">
            <ChatCircleText className="w-5 h-5" />
            Query Your Data
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">Ask any query.</p>

        {/* Query Input */}
        <textarea
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., What is the average sales by region? or Show me the top 5 customers by revenue"
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">Press ⌘/Ctrl + Enter to execute</span>
        </div>

        {/* Execute Button */}
        <button
          onClick={onExecuteQuery}
          disabled={!query || queryLoading}
          className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {queryLoading ? (
            <Spinner className="w-5 h-5 animate-spin" />
          ) : (
            <MagnifyingGlass className="w-5 h-5" />
          )}
          Execute Query
        </button>

        {/* Query Results */}
        {queryResult && (
          <div className="mt-6 space-y-4">
            {renderResultWithExplanation()}

            {/* Compatibility explanation (if payload shape differed) */}
            {!((queryResult as any)?.results?.summary) && renderCompatibilityExplanation()}

            {/* Error */}
            {(queryResult as any)?.error && (
              <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendUp className="w-5 h-5 rotate-180" />
                  <p className="font-semibold">Error</p>
                </div>
                <p className="text-red-100 leading-relaxed">{(queryResult as any).error}</p>
              </div>
            )}

            {/* No content state */}
            {queryResult &&
              !(queryResult as any)?.results?.data &&
              !(queryResult as any)?.error &&
              !(queryResult as any)?.code?.pandas &&
              !(queryResult as any)?.query?.interpretation &&
              !(queryResult as any)?.results?.summary && (
                <div className="text-center text-gray-500 text-sm mt-4">No output returned.</div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}