'use client'

import { Sidebar } from '@/components/layout/Sidebar'

const NODE_TYPES = [
  { id: 'trigger', name: 'Trigger', color: 'var(--node-trigger)', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'script', name: 'Script', color: 'var(--node-script)', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8' },
  { id: 'voice', name: 'Voice', color: 'var(--node-voice)', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8' },
  { id: 'thumbnail', name: 'Thumbnail', color: 'var(--node-thumbnail)', icon: 'M3 3h18v18H3z M8.5 8.5m-1.5 0a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0-3 0 M21 15l-5-5-11 11' },
  { id: 'assembly', name: 'Assembly', color: 'var(--node-assembly)', icon: 'M23 7l-7 5 7 5V7z M1 5h15v14H1z' },
  { id: 'publish', name: 'Publish', color: 'var(--node-publish)', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12' },
]

const PIPELINE_NODES = [
  { id: 'trigger', type: 'trigger', x: 60, y: 175, title: 'Trigger', subtitle: 'Topic Input', hasInput: false, hasOutput: true },
  { id: 'script', type: 'script', x: 300, y: 155, title: 'Script', subtitle: 'Claude AI', hasInput: true, hasOutput: true, selected: true },
  { id: 'voice', type: 'voice', x: 540, y: 110, title: 'Voice', subtitle: 'ElevenLabs', hasInput: true, hasOutput: true },
  { id: 'thumbnail', type: 'thumbnail', x: 540, y: 230, title: 'Thumbnail', subtitle: 'Gemini Imagen', hasInput: true, hasOutput: true },
  { id: 'assembly', type: 'assembly', x: 780, y: 175, title: 'Assembly', subtitle: 'FFmpeg', hasInput: true, hasOutput: true },
  { id: 'publish', type: 'publish', x: 1020, y: 175, title: 'Publish', subtitle: 'YouTube', hasInput: true, hasOutput: false },
]

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    trigger: 'var(--node-trigger)',
    script: 'var(--node-script)',
    voice: 'var(--node-voice)',
    thumbnail: 'var(--node-thumbnail)',
    assembly: 'var(--node-assembly)',
    publish: 'var(--node-publish)',
  }
  return colors[type] || 'var(--text-muted)'
}

function getNodeGlow(type: string): string {
  const glows: Record<string, string> = {
    trigger: 'var(--node-trigger-glow)',
    script: 'var(--node-script-glow)',
    voice: 'var(--node-voice-glow)',
    thumbnail: 'var(--node-thumbnail-glow)',
    assembly: 'var(--node-assembly-glow)',
    publish: 'var(--node-publish-glow)',
  }
  return glows[type] || 'transparent'
}

function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    trigger: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    script: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    voice: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z',
    thumbnail: 'M3 3h18v18H3z',
    assembly: 'M23 7l-7 5 7 5V7z',
    publish: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  }
  return icons[type] || ''
}

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
              New Run
            </button>
          </div>
        </header>

        <div className="editor">
          <div className="editor-toolbar">
            <div className="toolbar-group">
              <button className="toolbar-btn" title="Undo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.3 2.7L3 13"/>
                </svg>
              </button>
              <button className="toolbar-btn" title="Redo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.3 2.7L21 13"/>
                </svg>
              </button>
            </div>
            <div className="toolbar-group">
              <button className="toolbar-btn" title="Auto Layout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button className="toolbar-btn" title="Fit View">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
                </svg>
              </button>
            </div>
            <div className="toolbar-group" style={{ marginLeft: 'auto', borderRight: 'none' }}>
              <div className="run-button-group">
                <button className="run-button-main">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Run Pipeline
                </button>
                <button className="run-button-cost" title="Estimated API cost for this run">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  ~$0.45
                </button>
              </div>
            </div>
          </div>

          <div className="editor-container">
            <div className="node-palette">
              <div className="palette-title">Nodes</div>
              {NODE_TYPES.map((node) => (
                <div key={node.id} className="palette-node">
                  <div className="palette-node-icon" style={{ background: node.color }}>
                    <svg viewBox="0 0 24 24">
                      <path d={node.icon} />
                    </svg>
                  </div>
                  <span className="palette-node-name">{node.name}</span>
                </div>
              ))}
            </div>

            <div className="canvas-wrapper">
              <div className="canvas">
                <div className="canvas-grid"></div>

                {/* YouTube Watermark */}
                <div className="youtube-watermark">
                  <svg viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </div>

                {/* Edges SVG */}
                <svg className="edges-svg" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="edge-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--node-trigger)' }}/>
                      <stop offset="100%" style={{ stopColor: 'var(--node-script)' }}/>
                    </linearGradient>
                    <linearGradient id="edge-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--node-script)' }}/>
                      <stop offset="100%" style={{ stopColor: 'var(--node-voice)' }}/>
                    </linearGradient>
                    <linearGradient id="edge-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--node-script)' }}/>
                      <stop offset="100%" style={{ stopColor: 'var(--node-thumbnail)' }}/>
                    </linearGradient>
                    <linearGradient id="edge-gradient-4" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--node-voice)' }}/>
                      <stop offset="100%" style={{ stopColor: 'var(--node-assembly)' }}/>
                    </linearGradient>
                    <linearGradient id="edge-gradient-5" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--node-thumbnail)' }}/>
                      <stop offset="100%" style={{ stopColor: 'var(--node-assembly)' }}/>
                    </linearGradient>
                    <linearGradient id="edge-gradient-6" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--node-assembly)' }}/>
                      <stop offset="100%" style={{ stopColor: 'var(--node-publish)' }}/>
                    </linearGradient>
                  </defs>

                  {/* Edge glow effects */}
                  <path className="edge-glow" d="M 220 215 C 260 215, 260 195, 300 195" stroke="url(#edge-gradient-1)"/>
                  <path className="edge-glow" d="M 460 195 C 500 195, 500 150, 540 150" stroke="url(#edge-gradient-2)"/>
                  <path className="edge-glow" d="M 460 195 C 500 195, 500 270, 540 270" stroke="url(#edge-gradient-3)"/>
                  <path className="edge-glow" d="M 700 150 C 740 150, 740 215, 780 215" stroke="url(#edge-gradient-4)"/>
                  <path className="edge-glow" d="M 700 270 C 740 270, 740 215, 780 215" stroke="url(#edge-gradient-5)"/>
                  <path className="edge-glow" d="M 940 215 C 980 215, 980 215, 1020 215" stroke="url(#edge-gradient-6)"/>

                  {/* Edges */}
                  <path className="edge edge-animated" d="M 220 215 C 260 215, 260 195, 300 195" stroke="url(#edge-gradient-1)"/>
                  <path className="edge edge-animated" d="M 460 195 C 500 195, 500 150, 540 150" stroke="url(#edge-gradient-2)" style={{ animationDelay: '0.2s' }}/>
                  <path className="edge edge-animated" d="M 460 195 C 500 195, 500 270, 540 270" stroke="url(#edge-gradient-3)" style={{ animationDelay: '0.4s' }}/>
                  <path className="edge edge-animated" d="M 700 150 C 740 150, 740 215, 780 215" stroke="url(#edge-gradient-4)" style={{ animationDelay: '0.6s' }}/>
                  <path className="edge edge-animated" d="M 700 270 C 740 270, 740 215, 780 215" stroke="url(#edge-gradient-5)" style={{ animationDelay: '0.8s' }}/>
                  <path className="edge edge-animated" d="M 940 215 C 980 215, 980 215, 1020 215" stroke="url(#edge-gradient-6)" style={{ animationDelay: '1s' }}/>
                </svg>

                {/* Pipeline Nodes */}
                {PIPELINE_NODES.map((node) => (
                  <div
                    key={node.id}
                    className={`pipeline-node ${node.selected ? 'selected' : ''}`}
                    style={{
                      left: node.x,
                      top: node.y,
                      borderLeft: `3px solid ${getNodeColor(node.type)}`,
                    }}
                  >
                    <div className="node-header">
                      <div
                        className="node-icon"
                        style={{
                          background: getNodeColor(node.type),
                          boxShadow: `0 0 20px ${getNodeGlow(node.type)}`,
                        }}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d={getNodeIcon(node.type)} />
                        </svg>
                      </div>
                      <div>
                        <div className="node-title">{node.title}</div>
                        <div className="node-subtitle">{node.subtitle}</div>
                      </div>
                    </div>
                    {node.hasInput && <div className="node-handle input"></div>}
                    {node.hasOutput && <div className="node-handle output"></div>}
                  </div>
                ))}

                {/* Zoom Controls */}
                <div className="zoom-controls">
                  <button className="zoom-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <span className="zoom-level">100%</span>
                  <button className="zoom-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>

                {/* Minimap */}
                <div className="minimap">
                  <div className="minimap-viewport"></div>
                  <div className="minimap-node" style={{ background: 'var(--node-trigger)', left: '10%', top: '40%' }}></div>
                  <div className="minimap-node" style={{ background: 'var(--node-script)', left: '28%', top: '35%' }}></div>
                  <div className="minimap-node" style={{ background: 'var(--node-voice)', left: '46%', top: '25%' }}></div>
                  <div className="minimap-node" style={{ background: 'var(--node-thumbnail)', left: '46%', top: '55%' }}></div>
                  <div className="minimap-node" style={{ background: 'var(--node-assembly)', left: '64%', top: '40%' }}></div>
                  <div className="minimap-node" style={{ background: 'var(--node-publish)', left: '82%', top: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
