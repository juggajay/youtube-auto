'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRunStore, NodeId } from '@/stores/runStore'

type NodeDisplayStatus = 'completed' | 'running' | 'needs-review' | 'pending' | 'failed'

interface PipelineNode {
  id: NodeId
  name: string
  icon: React.ReactNode
  color: string
}

const PIPELINE_NODE_DEFS: PipelineNode[] = [
  {
    id: 'script',
    name: 'Script',
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    color: 'var(--node-script)',
  },
  {
    id: 'voice',
    name: 'Voice',
    icon: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></>,
    color: 'var(--node-voice)',
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail',
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    color: 'var(--node-thumbnail)',
  },
  {
    id: 'assembly',
    name: 'Assembly',
    icon: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    color: 'var(--node-assembly)',
  },
  {
    id: 'publish',
    name: 'Publish',
    icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    color: 'var(--node-publish)',
  },
]

export default function RunViewPage() {
  const params = useParams()
  const pageRunId = params.id as string
  const { runId, status, nodeProgress, logs, startedAt } = useRunStore()

  const [activeTab, setActiveTab] = useState<'output' | 'logs' | 'config'>('output')

  // Show empty state if no run or if the URL doesn't match the current run
  if (!runId || runId !== pageRunId) {
    return (
      <div className="app">
        <Sidebar />
        <main className="main">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <h3 className="empty-state-title">Run not found</h3>
            <p className="empty-state-text">
              This run doesn&apos;t exist or has been cleared.
            </p>
            <Link href="/runs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Back to Runs
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const getNodeStatus = (nodeId: NodeId): NodeDisplayStatus => {
    const node = nodeProgress[nodeId]
    if (!node) return 'pending'
    if (node.status === 'intervention') return 'needs-review'
    return node.status as NodeDisplayStatus
  }

  const getNodeStatusText = (displayStatus: NodeDisplayStatus): string => {
    switch (displayStatus) {
      case 'completed': return 'Complete'
      case 'running': return 'Running...'
      case 'needs-review': return 'Review'
      case 'failed': return 'Failed'
      default: return 'Pending'
    }
  }

  const completedCount = PIPELINE_NODE_DEFS.filter(n => getNodeStatus(n.id) === 'completed').length
  const progressPercent = (completedCount / PIPELINE_NODE_DEFS.length) * 100

  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <div className="run-view">
          <div className="run-pipeline">
            <div className="canvas-grid"></div>

            <div className="youtube-watermark" style={{ opacity: 0.015 }}>
              <svg viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>

            <div className="run-pipeline-nodes">
              {PIPELINE_NODE_DEFS.map((node, index) => {
                const nodeStatus = getNodeStatus(node.id)
                const prevStatus = index > 0 ? getNodeStatus(PIPELINE_NODE_DEFS[index - 1].id) : 'completed'

                return (
                  <div key={node.name} className="run-node-wrapper" style={{ display: 'contents' }}>
                    {index > 0 && (
                      <div
                        className={`run-edge ${prevStatus === 'completed' ? 'completed' : ''}`}
                      />
                    )}
                    <div className={`run-node ${nodeStatus}`}>
                      {nodeStatus === 'needs-review' && (
                        <div className="run-node-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 9v4M12 17h.01"/>
                          </svg>
                        </div>
                      )}
                      <div className="run-node-icon" style={{ background: nodeStatus === 'failed' ? 'var(--status-error)' : node.color }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {node.icon}
                        </svg>
                      </div>
                      <div className="run-node-name">{node.name}</div>
                      <div
                        className="run-node-status"
                        style={{
                          color: nodeStatus === 'needs-review' ? 'var(--status-warning)'
                            : nodeStatus === 'failed' ? 'var(--status-error)'
                            : undefined
                        }}
                      >
                        {getNodeStatusText(nodeStatus)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="total-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="progress-text">
                {status === 'completed' ? (
                  <span style={{ color: 'var(--status-success)' }}>Pipeline completed</span>
                ) : status === 'failed' ? (
                  <span style={{ color: 'var(--status-error)' }}>Pipeline failed</span>
                ) : (
                  <span>Pipeline running - {completedCount}/{PIPELINE_NODE_DEFS.length} nodes complete</span>
                )}
              </div>
            </div>
          </div>

          <div className="run-sidebar">
            <div className="run-sidebar-header">
              <div className="run-sidebar-title">Run {runId}</div>
              <div className="run-sidebar-meta">
                {startedAt ? `Started ${new Date(startedAt).toLocaleString()}` : 'Not started'}
              </div>
            </div>

            <div className="run-tabs">
              <div
                className={`run-tab ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </div>
              <div
                className={`run-tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                Logs
              </div>
              <div
                className={`run-tab ${activeTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveTab('config')}
              >
                Config
              </div>
            </div>

            <div className="run-content">
              {activeTab === 'output' && (
                <>
                  {PIPELINE_NODE_DEFS.map((nodeDef) => {
                    const nodeData = nodeProgress[nodeDef.id]
                    if (!nodeData?.output) return null
                    return (
                      <div key={nodeDef.id} className="output-section">
                        <div className="output-label">{nodeDef.name} Output</div>
                        <div className="output-text" style={{ maxHeight: 200, overflowY: 'auto' }}>
                          <pre style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                            {typeof nodeData.output === 'string'
                              ? nodeData.output
                              : JSON.stringify(nodeData.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )
                  })}
                  {!PIPELINE_NODE_DEFS.some(n => nodeProgress[n.id]?.output) && (
                    <div className="output-section">
                      <div className="output-text" style={{ color: 'var(--text-secondary)' }}>
                        No output yet. Run the pipeline to see results.
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'logs' && (
                <div className="output-section">
                  {logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <div key={log.id} className="log-entry">
                        <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`log-message ${log.level}`}>{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="output-text" style={{ color: 'var(--text-secondary)' }}>
                      No logs yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'config' && (
                <div className="output-section">
                  <div className="output-label">Run Configuration</div>
                  <div className="output-text">
                    <pre style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify({ id: runId, status, startedAt }, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
