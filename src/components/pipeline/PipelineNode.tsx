'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

export interface PipelineNodeData {
  label: string
  subtitle: string
  nodeType: 'trigger' | 'script' | 'voice' | 'thumbnail' | 'assembly' | 'publish'
}

const NODE_COLORS: Record<string, string> = {
  trigger: 'var(--node-trigger, #22d3ee)',
  script: 'var(--node-script, #a78bfa)',
  voice: 'var(--node-voice, #f472b6)',
  thumbnail: 'var(--node-thumbnail, #fbbf24)',
  assembly: 'var(--node-assembly, #34d399)',
  publish: 'var(--node-publish, #f87171)',
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
  const color = NODE_COLORS[data.nodeType] || '#888'
  const icon = NODE_ICONS[data.nodeType] || ''
  const hasInput = data.nodeType !== 'trigger'
  const hasOutput = data.nodeType !== 'publish'

  return (
    <div
      className={`pipeline-node ${selected ? 'selected' : ''}`}
      style={{
        borderLeft: `3px solid ${color}`,
        background: 'var(--card-bg, #1a1a2e)',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '140px',
        boxShadow: selected ? `0 0 20px ${color}40` : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: color,
            width: 10,
            height: 10,
            border: '2px solid var(--bg, #0f0f1a)',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 15px ${color}60`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            style={{ width: '16px', height: '16px' }}
          >
            <path d={icon} />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text, #fff)' }}>
            {data.label}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
            {data.subtitle}
          </div>
        </div>
      </div>

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: color,
            width: 10,
            height: 10,
            border: '2px solid var(--bg, #0f0f1a)',
          }}
        />
      )}
    </div>
  )
}

export default memo(PipelineNode)
