'use client'

import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'

const ALL_RUNS = [
  {
    id: '1',
    title: 'Top 10 AI Tools for 2024',
    status: 'running' as const,
    meta: 'Running - Script generation',
    time: '2m ago',
    nodes: [
      { color: 'var(--node-trigger)', completed: true },
      { color: 'var(--node-script)', completed: false },
      { color: 'var(--node-voice)', completed: false },
      { color: 'var(--node-thumbnail)', completed: false },
      { color: 'var(--node-assembly)', completed: false },
      { color: 'var(--node-publish)', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Why Python is Taking Over',
    status: 'success' as const,
    meta: 'Completed - 8:42 duration',
    time: '1h ago',
    nodes: [
      { color: 'var(--node-trigger)', completed: true },
      { color: 'var(--node-script)', completed: true },
      { color: 'var(--node-voice)', completed: true },
      { color: 'var(--node-thumbnail)', completed: true },
      { color: 'var(--node-assembly)', completed: true },
      { color: 'var(--node-publish)', completed: true },
    ],
  },
  {
    id: '3',
    title: 'React vs Vue in 2024',
    status: 'error' as const,
    meta: 'Failed - Voice generation error',
    time: '3h ago',
    nodes: [
      { color: 'var(--node-trigger)', completed: true },
      { color: 'var(--node-script)', completed: true },
      { color: 'var(--status-error)', completed: true },
      { color: 'var(--node-thumbnail)', completed: false },
      { color: 'var(--node-assembly)', completed: false },
      { color: 'var(--node-publish)', completed: false },
    ],
  },
  {
    id: '4',
    title: '5 JavaScript Tips You Need',
    status: 'success' as const,
    meta: 'Completed - 6:15 duration',
    time: 'Yesterday',
    nodes: [
      { color: 'var(--node-trigger)', completed: true },
      { color: 'var(--node-script)', completed: true },
      { color: 'var(--node-voice)', completed: true },
      { color: 'var(--node-thumbnail)', completed: true },
      { color: 'var(--node-assembly)', completed: true },
      { color: 'var(--node-publish)', completed: true },
    ],
  },
  {
    id: '5',
    title: 'Building a SaaS in 30 Days',
    status: 'success' as const,
    meta: 'Completed - 12:30 duration',
    time: '2 days ago',
    nodes: [
      { color: 'var(--node-trigger)', completed: true },
      { color: 'var(--node-script)', completed: true },
      { color: 'var(--node-voice)', completed: true },
      { color: 'var(--node-thumbnail)', completed: true },
      { color: 'var(--node-assembly)', completed: true },
      { color: 'var(--node-publish)', completed: true },
    ],
  },
]

export default function RunsListPage() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">All Runs</h1>
        </header>

        <div className="dashboard">
          <div className="runs-list">
            {ALL_RUNS.map((run) => (
              <Link key={run.id} href={`/runs/${run.id}`} className="run-item">
                <div className={`run-status ${run.status}`}></div>
                <div className="run-info">
                  <div className="run-title">{run.title}</div>
                  <div className="run-meta">
                    <span>{run.meta}</span>
                  </div>
                </div>
                <div className="run-nodes">
                  {run.nodes.map((node, i) => (
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
                <div className="run-time">{run.time}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
