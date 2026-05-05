'use client'

import { UploadSimple, FileCsv, Lightning, ArrowRight } from 'phosphor-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Animated Background */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
          <FileCsv className="w-12 h-12 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        Welcome to DataLens AI
      </h2>
      <p className="text-gray-400 max-w-md mb-8">
        Upload your dataset to generate AI-powered visualizations, 
        insights, and analytics in seconds.
      </p>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full">
        <div className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3 group-hover:bg-cyan-500/30 transition-colors">
            <Lightning className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Instant Analysis</h3>
          <p className="text-xs text-gray-400">AI automatically generates the best visualizations for your data</p>
        </div>

        <div className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 hover:border-purple-500/50 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition-colors">
            <UploadSimple className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Multiple Formats</h3>
          <p className="text-xs text-gray-400">Support for CSV, Excel, JSON, Parquet and more</p>
        </div>

        <div className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700 hover:border-lime-500/50 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-lime-500/20 flex items-center justify-center mb-3 group-hover:bg-lime-500/30 transition-colors">
            <ArrowRight className="w-5 h-5 text-lime-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Interactive Dashboards</h3>
          <p className="text-xs text-gray-400">Explore your data with filters, charts, and AI insights</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
        <span>Get started ?</span>
        <span className="text-cyan-400">Upload a file above</span>
      </div>
    </div>
  )
}
