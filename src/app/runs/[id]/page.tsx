'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

type NodeStatus = 'completed' | 'running' | 'needs-review' | 'pending'

interface RunNode {
  name: string
  icon: React.ReactNode
  color: string
  status: NodeStatus
  statusText: string
}

const PIPELINE_NODES: RunNode[] = [
  {
    name: 'Trigger',
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
    color: 'var(--node-trigger)',
    status: 'completed',
    statusText: 'Complete',
  },
  {
    name: 'Script',
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    color: 'var(--node-script)',
    status: 'needs-review',
    statusText: 'Review',
  },
  {
    name: 'Voice',
    icon: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></>,
    color: 'var(--node-voice)',
    status: 'pending',
    statusText: 'Waiting',
  },
  {
    name: 'Assembly',
    icon: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    color: 'var(--node-assembly)',
    status: 'pending',
    statusText: 'Pending',
  },
  {
    name: 'Publish',
    icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    color: 'var(--node-publish)',
    status: 'pending',
    statusText: 'Pending',
  },
]

export default function RunViewPage() {
  const [activeTab, setActiveTab] = useState<'output' | 'logs' | 'config'>('output')

  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <div className="run-view">
          <div className="run-pipeline">
            <div className="canvas-grid"></div>

            {/* YouTube Watermark */}
            <div className="youtube-watermark" style={{ opacity: 0.015 }}>
              <svg viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>

            <div className="run-pipeline-nodes">
              {PIPELINE_NODES.map((node, index) => (
                <div key={node.name} className="run-node-wrapper" style={{ display: 'contents' }}>
                  {index > 0 && (
                    <div
                      className={`run-edge ${PIPELINE_NODES[index - 1].status === 'completed' ? 'completed' : ''}`}
                    />
                  )}
                  <div className={`run-node ${node.status}`}>
                    {node.status === 'needs-review' && (
                      <div className="run-node-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 9v4M12 17h.01"/>
                        </svg>
                      </div>
                    )}
                    <div className="run-node-icon" style={{ background: node.color }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {node.icon}
                      </svg>
                    </div>
                    <div className="run-node-name">{node.name}</div>
                    <div
                      className="run-node-status"
                      style={{ color: node.status === 'needs-review' ? 'var(--status-warning)' : undefined }}
                    >
                      {node.statusText}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="total-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '25%' }}></div>
              </div>
              <div className="progress-text">
                Pipeline paused - <span style={{ color: 'var(--status-warning)' }}>Awaiting review</span>
              </div>
            </div>
          </div>

          <div className="run-sidebar">
            <div className="run-sidebar-header">
              <div className="run-sidebar-title">Top 10 AI Tools for 2024</div>
              <div className="run-sidebar-meta">Started 2 minutes ago - Run #47</div>
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
                  <div className="output-section">
                    <div className="output-label">Script Title</div>
                    <div className="output-text">Top 10 AI Tools That Will Blow Your Mind in 2024</div>
                  </div>

                  <div className="output-section">
                    <div className="output-label">Script Preview</div>
                    <div className="output-text" style={{ maxHeight: 200, overflowY: 'auto' }}>
                      Welcome back to the channel! Today we&apos;re diving into the top 10 AI tools that are absolutely changing the game in 2024. Whether you&apos;re a developer, content creator, or just someone who wants to be more productive, these tools are going to blow your mind...
                      <br/><br/>
                      Number 10: Cursor IDE - This AI-powered code editor is like having a senior developer looking over your shoulder 24/7...
                    </div>
                  </div>

                  <div className="output-section review-required">
                    <div className="review-header">
                      <div className="review-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
                          <path d="M12 9v4M12 17h.01"/>
                        </svg>
                      </div>
                      <div>
                        <div className="review-title">Review Required</div>
                        <div className="review-desc">Script generation complete - approve or edit before continuing</div>
                      </div>
                    </div>
                    <button className="btn btn-warning">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Review Script
                    </button>
                  </div>

                  <div className="output-section">
                    <div className="output-label">Recent Logs</div>
                    <div className="log-entry">
                      <span className="log-time">12:34:18</span>
                      <span className="log-message info">Starting script generation...</span>
                    </div>
                    <div className="log-entry">
                      <span className="log-time">12:34:22</span>
                      <span className="log-message success">Script generation complete</span>
                    </div>
                    <div className="log-entry">
                      <span className="log-time">12:34:22</span>
                      <span className="log-message warning">Awaiting user review</span>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'logs' && (
                <div className="output-section">
                  <div className="log-entry">
                    <span className="log-time">12:34:15</span>
                    <span className="log-message info">Pipeline started</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">12:34:16</span>
                    <span className="log-message success">Trigger completed</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">12:34:18</span>
                    <span className="log-message info">Starting script generation...</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">12:34:22</span>
                    <span className="log-message success">Script generation complete</span>
                  </div>
                  <div className="log-entry">
                    <span className="log-time">12:34:22</span>
                    <span className="log-message warning">Awaiting user review</span>
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="output-section">
                  <div className="output-label">Pipeline Configuration</div>
                  <div className="output-text">
                    <pre style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
{`{
  "trigger": "manual",
  "script": {
    "model": "claude-3-opus",
    "archetype": "listicle"
  },
  "voice": {
    "provider": "elevenlabs",
    "voice_id": "adam"
  }
}`}
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
