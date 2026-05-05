'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadSimple, FileCsv, Sun, Moon, X, CheckCircle, Warning } from 'phosphor-react'
import { useTheme } from './ThemeProvider'

interface ConfigPanelProps {
  file: File | null
  loading: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
}

export default function ConfigPanel({ file, loading, onFileChange, onUpload }: ConfigPanelProps) {
  const { theme, toggleTheme } = useTheme()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0 && fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(files[0])
      fileInputRef.current.files = dataTransfer.files
      onFileChange({ target: { files: dataTransfer.files } } as any)
    }
  }

  return (
    <div className="w-full">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-2 sm:p-3 bg-gray-800/60 backdrop-blur-xl rounded-xl border border-gray-700">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FileCsv className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
          </div>
          <div className="flex-1 sm:flex-none">
            <h1 className="text-sm sm:text-lg font-bold text-white">DataLens AI</h1>
            <p className="text-xs text-gray-400 hidden sm:block">AI-Powered Analytics</p>
          </div>
        </div>

        {/* Upload Zone - Compact */}
        <div className="flex-1 w-full max-w-xl order-3 sm:order-2">
          <label
            className={`
              block w-full rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
              ${isDragOver 
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]' 
                : file 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700/30 hover:bg-gray-700/50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,.parquet,.pkl,.tsv"
              onChange={onFileChange}
              className="hidden"
            />
            
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2">
              {mounted && file ? (
                <>
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">{(file.size / 1024).toFixed(1)} KB • Ready to analyze</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (fileInputRef.current) fileInputRef.current.value = ''
                      onFileChange({ target: { files: null } } as any)
                    }}
                    className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
                  </button>
                </>
              ) : (
                <>
                  <UploadSimple className={`w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 ${isDragOver ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-300">
                      <span className="text-cyan-400 font-medium">Click to upload</span>
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">CSV, Excel, JSON, Parquet</p>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-2 sm:order-3">
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all border border-gray-600 hover:border-gray-500"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
          </button>
          
          <button
            onClick={onUpload}
            disabled={!file || loading}
            className={`
              px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap
              ${!file 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : loading 
                  ? 'bg-cyan-600/50 text-white/50 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <UploadSimple className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">Analyze Data</span>
                <span className="sm:hidden">Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
