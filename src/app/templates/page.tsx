'use client'

import { Sidebar } from '@/components/layout/Sidebar'

const TEMPLATES = [
  {
    id: 'listicle',
    name: 'Top 10 Listicle',
    description: 'Perfect for countdown videos and list-style content',
    nodes: ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish'],
    color: 'var(--node-script)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'tutorial',
    name: 'Tutorial Video',
    description: 'Step-by-step educational content with screen recordings',
    nodes: ['trigger', 'script', 'voice', 'assembly', 'publish'],
    color: 'var(--node-voice)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
  },
  {
    id: 'news',
    name: 'News Recap',
    description: 'Quick news updates and trending topics coverage',
    nodes: ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish'],
    color: 'var(--node-trigger)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'review',
    name: 'Product Review',
    description: 'In-depth product analysis with pros and cons',
    nodes: ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish'],
    color: 'var(--node-thumbnail)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    id: 'shorts',
    name: 'YouTube Shorts',
    description: 'Vertical short-form content under 60 seconds',
    nodes: ['trigger', 'script', 'voice', 'assembly', 'publish'],
    color: 'var(--node-assembly)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="2" width="10" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'custom',
    name: 'Custom Pipeline',
    description: 'Start from scratch with a blank canvas',
    nodes: [],
    color: 'var(--text-muted)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
]

export default function TemplatesPage() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Templates</h1>
          <div className="header-actions">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Choose a template to start your pipeline
            </span>
          </div>
        </header>

        <div className="templates">
          <div className="templates-grid">
            {TEMPLATES.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-icon" style={{ background: template.color }}>
                  {template.icon}
                </div>
                <div className="template-content">
                  <h3 className="template-name">{template.name}</h3>
                  <p className="template-description">{template.description}</p>
                  {template.nodes.length > 0 && (
                    <div className="template-nodes">
                      {template.nodes.map((node) => (
                        <div
                          key={node}
                          className="template-node-dot"
                          style={{ background: `var(--node-${node})` }}
                          title={node}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button className="template-use-btn">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
