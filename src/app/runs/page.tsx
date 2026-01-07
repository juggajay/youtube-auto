'use client'

import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRunStore } from '@/stores/runStore'

export default function RunsListPage() {
  const { runId, status, nodeProgress, startedAt } = useRunStore()

  const hasActiveRun = runId !== null

  const nodeIds = ['script', 'voice', 'thumbnail', 'assembly', 'publish'] as const
  const nodeColors: Record<string, string> = {
    script: 'var(--node-script)',
    voice: 'var(--node-voice)',
    thumbnail: 'var(--node-thumbnail)',
    assembly: 'var(--node-assembly)',
    publish: 'var(--node-publish)',
  }

  const overallStatus = status === 'completed' ? 'success'
    : status === 'failed' ? 'error'
    : 'running'

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">All Runs</h1>
        </header>

        <div className="dashboard">
          {!hasActiveRun ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 className="empty-state-title">No runs yet</h3>
              <p className="empty-state-text">
                Start a pipeline from the <Link href="/pipeline" style={{ color: 'var(--accent-primary)' }}>Pipeline Editor</Link> to see your runs here.
              </p>
            </div>
          ) : (
            <div className="runs-list">
              <Link href={`/runs/${runId}`} className="run-item">
                <div className={`run-status ${overallStatus}`}></div>
                <div className="run-info">
                  <div className="run-title">Run {runId}</div>
                  <div className="run-meta">
                    <span>{status}</span>
                  </div>
                </div>
                <div className="run-nodes">
                  {nodeIds.map((nodeId) => {
                    const node = nodeProgress[nodeId]
                    const isCompleted = node?.status === 'completed'
                    const isFailed = node?.status === 'failed'
                    return (
                      <div
                        key={nodeId}
                        className="run-node-dot"
                        style={{
                          background: isFailed ? 'var(--status-error)' : nodeColors[nodeId],
                          opacity: isCompleted || isFailed ? 1 : 0.3,
                        }}
                      />
                    )
                  })}
                </div>
                <div className="run-time">
                  {startedAt ? new Date(startedAt).toLocaleTimeString() : '-'}
                </div>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
