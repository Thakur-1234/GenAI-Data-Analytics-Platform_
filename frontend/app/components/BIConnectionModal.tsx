'use client'

import { useState } from 'react'
import { X, Cloud, Table, CheckCircle, WarningCircle } from 'phosphor-react'

interface BIConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
  apiBaseUrl: string
}

export default function BIConnectionModal({ isOpen, onClose, sessionId, apiBaseUrl }: BIConnectionModalProps) {
  const [activeTab, setActiveTab] = useState<'powerbi' | 'tableau'>('powerbi')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Power BI credentials
  const [powerbiTenantId, setPowerbiTenantId] = useState('')
  const [powerbiClientId, setPowerbiClientId] = useState('')
  const [powerbiClientSecret, setPowerbiClientSecret] = useState('')
  const [powerbiWorkspaceId, setPowerbiWorkspaceId] = useState('')
  const [datasetName, setDatasetName] = useState('MyDataSet')
  
  // Tableau credentials
  const [tableauServerUrl, setTableauServerUrl] = useState('')
  const [tableauTokenName, setTableauTokenName] = useState('')
  const [tableauTokenSecret, setTableauTokenSecret] = useState('')
  const [tableauSiteId, setTableauSiteId] = useState('')
  const [datasourceName, setDatasourceName] = useState('MyDataSource')

  const handlePowerBISubmit = async () => {
    if (!sessionId) return
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/bi/powerbi/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          dataset_name: datasetName,
          tenant_id: powerbiTenantId,
          client_id: powerbiClientId,
          client_secret: powerbiClientSecret,
          workspace_id: powerbiWorkspaceId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setResult({ success: true, message: `Successfully pushed ${data.rows_pushed} rows to Power BI!` })
      } else {
        setResult({ success: false, message: data.message || 'Failed to push to Power BI' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to connect to Power BI' })
    } finally {
      setLoading(false)
    }
  }

  const handleTableauSubmit = async () => {
    if (!sessionId) return
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/bi/tableau/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: tableauServerUrl,
          token_name: tableauTokenName,
          token_secret: tableauTokenSecret,
          site_id: tableauSiteId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setResult({ success: true, message: `Successfully prepared ${data.rows_published} rows for Tableau!` })
      } else {
        setResult({ success: false, message: data.message || 'Failed to publish to Tableau' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to connect to Tableau' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            Connect to BI Tools
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => { setActiveTab('powerbi'); setResult(null) }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'powerbi' 
                ? 'text-sky-400 border-b-2 border-sky-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4 inline mr-2" />
            Power BI
          </button>
          <button
            onClick={() => { setActiveTab('tableau'); setResult(null) }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'tableau' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4 inline mr-2" />
            Tableau
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {activeTab === 'powerbi' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enter your Azure AD credentials to push data directly to Power BI.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Dataset Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  placeholder="MyDataset"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tenant ID</label>
                <input
                  type="text"
                  value={powerbiTenantId}
                  onChange={(e) => setPowerbiTenantId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Client ID (App ID)</label>
                <input
                  type="text"
                  value={powerbiClientId}
                  onChange={(e) => setPowerbiClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={powerbiClientSecret}
                  onChange={(e) => setPowerbiClientSecret(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  placeholder="Your client secret"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Workspace ID</label>
                <input
                  type="text"
                  value={powerbiWorkspaceId}
                  onChange={(e) => setPowerbiWorkspaceId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              
              <button
                onClick={handlePowerBISubmit}
                disabled={loading || !powerbiTenantId || !powerbiClientId || !powerbiClientSecret}
                className="w-full px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Pushing...' : 'Push to Power BI'}
              </button>
            </div>
          )}
          
          {activeTab === 'tableau' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enter your Tableau Server/Cloud credentials to publish the datasource.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Datasource Name</label>
                <input
                  type="text"
                  value={datasourceName}
                  onChange={(e) => setDatasourceName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="MyDataSource"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Server URL</label>
                <input
                  type="text"
                  value={tableauServerUrl}
                  onChange={(e) => setTableauServerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="https://your-server.tableau.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Personal Access Token Name</label>
                <input
                  type="text"
                  value={tableauTokenName}
                  onChange={(e) => setTableauTokenName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Your token name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Personal Access Token Secret</label>
                <input
                  type="password"
                  value={tableauTokenSecret}
                  onChange={(e) => setTableauTokenSecret(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Your token secret"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Site ID (optional)</label>
                <input
                  type="text"
                  value={tableauSiteId}
                  onChange={(e) => setTableauSiteId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Your site ID"
                />
              </div>
              
              <button
                onClick={handleTableauSubmit}
                disabled={loading || !tableauServerUrl || !tableauTokenName || !tableauTokenSecret}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Publishing...' : 'Publish to Tableau'}
              </button>
            </div>
          )}
          
          {/* Result */}
          {result && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              result.success ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <WarningCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
          <p>Your credentials are sent directly to the backend and never stored.</p>
        </div>
      </div>
    </div>
  )
}