'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

export interface PipelineNodeData {
  label: string
  subtitle: string
  nodeType: 'trigger' | 'script' | 'voice' | 'thumbnail' | 'assembly' | 'publish'
}

const NODE_COLORS: Record<string, { color: string; glow: string }> = {
  trigger: { color: 'var(--node-trigger)', glow: 'var(--node-trigger-glow)' },
  script: { color: 'var(--node-script)', glow: 'var(--node-script-glow)' },
  voice: { color: 'var(--node-voice)', glow: 'var(--node-voice-glow)' },
  thumbnail: { color: 'var(--node-thumbnail)', glow: 'var(--node-thumbnail-glow)' },
  assembly: { color: 'var(--node-assembly)', glow: 'var(--node-assembly-glow)' },
  publish: { color: 'var(--node-publish)', glow: 'var(--node-publish-glow)' },
}

const NODE_ICONS: Record<string, string> = {
  trigger: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  script: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
  voice: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z',
  thumbnail: 'M3 3h18v18H3z',
  assembly: 'M23 7l-7 5 7 5V7z',
  publish: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
}

interface PipelineNodeProps {
  data: PipelineNodeData
  selected?: boolean
}

function PipelineNode({ data, selected }: PipelineNodeProps) {
  const nodeStyle = NODE_COLORS[data.nodeType] || { color: 'var(--text-muted)', glow: 'transparent' }
  const icon = NODE_ICONS[data.nodeType] || ''
  const hasInput = data.nodeType !== 'trigger'
  const hasOutput = data.nodeType !== 'publish'

  return (
    <div
      className={`pipeline-node ${selected ? 'selected' : ''}`}
      style={{
        borderLeft: `3px solid ${nodeStyle.color}`,
      }}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="node-handle input"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--text-muted)',
          }}
        />
      )}

      <div className="node-header">
        <div
          className="node-icon"
          style={{
            background: nodeStyle.color,
            boxShadow: `0 0 20px ${nodeStyle.glow}`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d={icon} />
          </svg>
        </div>
        <div>
          <div className="node-title">{data.label}</div>
          <div className="node-subtitle">{data.subtitle}</div>
        </div>
      </div>

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="node-handle output"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--text-muted)',
          }}
        />
      )}
    </div>
  )
}

export default memo(PipelineNode)
