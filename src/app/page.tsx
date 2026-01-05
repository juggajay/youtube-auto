'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRunStore } from '@/lib/stores/runs'
import { useAuthStore } from '@/lib/stores/auth'

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'success'
    case 'running': return 'running'
    case 'failed': return 'error'
    case 'cancelled': return 'error'
    default: return 'pending'
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

function getNodeProgress(status: string, currentNode: string | null) {
  const nodeOrder = ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish']
  const nodeColors: Record<string, string> = {
    trigger: 'var(--node-trigger)',
    script: 'var(--node-script)',
    voice: 'var(--node-voice)',
    thumbnail: 'var(--node-thumbnail)',
    assembly: 'var(--node-assembly)',
    publish: 'var(--node-publish)',
  }

  const currentIndex = currentNode ? nodeOrder.indexOf(currentNode) : -1

  return nodeOrder.map((node, index) => {
    let completed = false
    let color = nodeColors[node]

    if (status === 'completed') {
      completed = true
    } else if (status === 'failed') {
      completed = index <= currentIndex
      if (index === currentIndex) {
        color = 'var(--status-error)'
      }
    } else if (status === 'running') {
      completed = index < currentIndex
    } else {
      completed = false
    }

    return { color, completed }
  })
}

export default function DashboardPage() {
  const { runs, isLoading, fetchRuns } = useRunStore()
  const { isAuthenticated, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isAuthenticated) {
      fetchRuns()
    }
  }, [isAuthenticated, fetchRuns])

  // Calculate stats from runs
  const completedRuns = runs.filter(r => r.status === 'completed')
  const totalRuns = runs.length
  const successRate = totalRuns > 0 ? Math.round((completedRuns.length / totalRuns) * 100) : 0

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Dashboard</h1>
        </header>

        <div className="dashboard">
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Videos Published</div>
              <div className="stat-value">{completedRuns.length}</div>
              <div className="stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                this week
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pipeline Runs</div>
              <div className="stat-value">{totalRuns}</div>
              <div className="stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                this week
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">{successRate}%</div>
              <div className="stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                overall
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">API Costs</div>
              <div className="stat-value">$0</div>
              <div className="stat-change neutral">
                Estimated
              </div>
            </div>
          </div>

          <div className="section-header">
            <h2 className="section-title">Recent Runs</h2>
            <Link href="/runs" className="section-link">View all</Link>
          </div>

          <div className="runs-list">
            {isLoading ? (
              <div className="loading-state">Loading runs...</div>
            ) : runs.length === 0 ? (
              <div className="empty-state">
                <p>No runs yet. Create a pipeline to get started!</p>
                <Link href="/pipelines" className="btn btn-primary">
                  Create Pipeline
                </Link>
              </div>
            ) : (
              runs.slice(0, 5).map((run) => {
                const nodes = getNodeProgress(run.status, run.current_node)
                return (
                  <Link key={run.id} href={`/runs/${run.id}`} className="run-item">
                    <div className={`run-status ${getStatusColor(run.status)}`}></div>
                    <div className="run-info">
                      <div className="run-title">
                        {String(run.config?.topic || `Run ${run.id.slice(0, 8)}`)}
                      </div>
                      <div className="run-meta">
                        <span>
                          {run.status === 'running' && run.current_node
                            ? `Running - ${run.current_node}`
                            : run.status === 'completed'
                            ? 'Completed'
                            : run.status === 'failed'
                            ? `Failed${run.error ? ` - ${run.error}` : ''}`
                            : run.status}
                        </span>
                      </div>
                    </div>
                    <div className="run-nodes">
                      {nodes.map((node, i) => (
                        <div
                          key={i}
                          className="run-node-dot"
                          style={{
                            background: node.color,
                            opacity: node.completed ? 1 : 0.3,
                          }}
                        />
                      ))}
                    </div>
                    <div className="run-time">{formatTime(run.created_at)}</div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
