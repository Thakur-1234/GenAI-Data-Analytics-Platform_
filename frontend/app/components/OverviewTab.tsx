'use client'

import { HardDrives, Table, File, Hash, Tag } from 'phosphor-react'
import { DataInfo } from './types'
import { ChartCard, StatKPI, SectionHeader } from './ui/SharedComponents'

interface OverviewTabProps {
  dataInfo: DataInfo
}

export default function OverviewTab({ dataInfo }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Dataset Info */}
      <div className="md:col-span-12">
        <ChartCard title="Dataset Information" icon={HardDrives}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">File Name</p>
              <p className="text-sm font-medium text-white truncate">{dataInfo.filename}</p>
            </div>
            <div className="p-3 bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Total Rows</p>
              <p className="text-lg font-bold text-cyan-400">{dataInfo.shape[0]?.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Total Columns</p>
              <p className="text-lg font-bold text-purple-400">{dataInfo.shape[1]}</p>
            </div>
            <div className="p-3 bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Sample Rows</p>
              <p className="text-lg font-bold text-lime-400">{dataInfo.sample_data.length}</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Quick Stats */}
      <div className="md:col-span-12">
        <SectionHeader title="Quick Statistics" icon={Hash} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatKPI 
            label="Numeric Columns" 
            value={dataInfo.numeric_columns.length} 
            color="#0080FF"
          />
          <StatKPI 
            label="Categorical Columns" 
            value={dataInfo.categorical_columns.length} 
            color="#BF00FF"
          />
          <StatKPI 
            label="Total Columns" 
            value={dataInfo.columns.length} 
            color="#00FFFF"
          />
          <StatKPI 
            label="Sample Data Rows" 
            value={dataInfo.sample_data.length} 
            color="#39FF14"
          />
        </div>
      </div>

      {/* Column Information */}
      <div className="md:col-span-6">
        <ChartCard title="Column Information" icon={Table}>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Column</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Type</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Semantic</th>
                </tr>
              </thead>
              <tbody>
                {dataInfo.columns.slice(0, 8).map((col, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 px-3 text-white font-medium">{col.name}</td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{col.dtype}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          col.semantic_type === 'numeric'
                            ? 'bg-blue-500/20 text-blue-400'
                            : col.semantic_type === 'datetime'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {col.semantic_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Sample Data */}
      <div className="md:col-span-6">
        <ChartCard title="Sample Data (5 rows)" icon={File}>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-700/30">
                  {dataInfo.columns.slice(0, 5).map((col, idx) => (
                    <th key={idx} className="text-left py-2 px-2 text-gray-400 font-medium">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataInfo.sample_data.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50">
                    {dataInfo.columns.slice(0, 5).map((col, cidx) => (
                      <td key={cidx} className="py-2 px-2 text-gray-300 truncate max-w-[100px]">
                        {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Column Types Breakdown */}
      <div className="md:col-span-6">
        <ChartCard title="Numeric Columns" icon={Tag}>
          <div className="flex flex-wrap gap-2">
            {dataInfo.numeric_columns.length > 0 ? (
              dataInfo.numeric_columns.map((col, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                  {col}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No numeric columns found</p>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="md:col-span-6">
        <ChartCard title="Categorical Columns" icon={Tag}>
          <div className="flex flex-wrap gap-2">
            {dataInfo.categorical_columns.length > 0 ? (
              dataInfo.categorical_columns.map((col, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                  {col}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No categorical columns found</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
