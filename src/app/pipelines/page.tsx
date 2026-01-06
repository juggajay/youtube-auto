'use client'

import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/Sidebar'

// Dynamic import to avoid SSR issues with React Flow
const PipelineEditor = dynamic(
  () => import('@/components/pipeline/PipelineEditor'),
  { ssr: false }
)

export default function PipelineEditorPage() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Pipeline Editor</h1>
          <div className="header-actions">
            <button className="btn btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              Search
            </button>
            <button className="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Pipeline
            </button>
          </div>
        </header>

        <PipelineEditor />
      </main>
    </div>
  )
}
