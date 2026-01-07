'use client'

import { useCallback, useRef, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  EdgeProps,
  getBezierPath,
  BaseEdge,
  NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import PipelineNode, { PipelineNodeData } from './PipelineNode'
import { ScriptPanel } from '@/components/nodes/panels/script/ScriptPanel'
import { VoicePanel } from '@/components/nodes/panels/voice/VoicePanel'
import { ThumbnailPanel } from '@/components/nodes/panels/thumbnail/ThumbnailPanel'
import { AssemblyPanel } from '@/components/nodes/panels/assembly/AssemblyPanel'
import { PublishPanel } from '@/components/nodes/panels/publish/PublishPanel'
import { useIdeationStore } from '@/stores/ideationStore'
import { useRunStore, NodeId } from '@/stores/runStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: Record<string, any> = {
  pipeline: PipelineNode,
}

// Custom edge data type
interface AnimatedEdgeData {
  sourceColor?: string
  targetColor?: string
}

// Custom animated edge with gradient
function AnimatedGradientEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const edgeData = data as AnimatedEdgeData | undefined
  const sourceColor = edgeData?.sourceColor || '#666'
  const targetColor = edgeData?.targetColor || '#666'
  const gradientId = `gradient-${id}`

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      {/* Glow effect */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={8}
        strokeOpacity={0.2}
        style={{ filter: 'blur(4px)' }}
      />
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: 2,
          strokeDasharray: '8 4',
          animation: 'edgeFlow 1s linear infinite',
        }}
      />
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: Record<string, any> = {
  animated: AnimatedGradientEdge,
}

const NODE_PALETTE = [
  { id: 'trigger', name: 'Trigger', subtitle: 'Topic Input', color: 'var(--node-trigger)', colorHex: '#06b6d4', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'script', name: 'Script', subtitle: 'Claude AI', color: 'var(--node-script)', colorHex: '#a855f7', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { id: 'voice', name: 'Voice', subtitle: 'ElevenLabs', color: 'var(--node-voice)', colorHex: '#f59e0b', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' },
  { id: 'thumbnail', name: 'Thumbnail', subtitle: 'Gemini Imagen', color: 'var(--node-thumbnail)', colorHex: '#ec4899', icon: 'M3 3h18v18H3z' },
  { id: 'assembly', name: 'Assembly', subtitle: 'FFmpeg', color: 'var(--node-assembly)', colorHex: '#10b981', icon: 'M23 7l-7 5 7 5V7z' },
  { id: 'publish', name: 'Publish', subtitle: 'YouTube', color: 'var(--node-publish)', colorHex: '#ff0000', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
]

// Get color for node type
function getNodeColor(nodeType: string): string {
  const node = NODE_PALETTE.find(n => n.id === nodeType)
  return node?.colorHex || '#666'
}

// Default pipeline for demo mode
const DEFAULT_NODES: Node[] = [
  { id: 'trigger-1', type: 'pipeline', position: { x: 60, y: 175 }, data: { label: 'Trigger', subtitle: 'Topic Input', nodeType: 'trigger' } },
  { id: 'script-1', type: 'pipeline', position: { x: 300, y: 155 }, data: { label: 'Script', subtitle: 'Claude AI', nodeType: 'script' } },
  { id: 'voice-1', type: 'pipeline', position: { x: 540, y: 110 }, data: { label: 'Voice', subtitle: 'ElevenLabs', nodeType: 'voice' } },
  { id: 'thumbnail-1', type: 'pipeline', position: { x: 540, y: 230 }, data: { label: 'Thumbnail', subtitle: 'Gemini Imagen', nodeType: 'thumbnail' } },
  { id: 'assembly-1', type: 'pipeline', position: { x: 780, y: 175 }, data: { label: 'Assembly', subtitle: 'FFmpeg', nodeType: 'assembly' } },
  { id: 'publish-1', type: 'pipeline', position: { x: 1020, y: 175 }, data: { label: 'Publish', subtitle: 'YouTube', nodeType: 'publish' } },
]

const DEFAULT_EDGES: Edge[] = [
  { id: 'e1', source: 'trigger-1', target: 'script-1', type: 'animated', data: { sourceColor: '#06b6d4', targetColor: '#a855f7' } },
  { id: 'e2', source: 'script-1', target: 'voice-1', type: 'animated', data: { sourceColor: '#a855f7', targetColor: '#f59e0b' } },
  { id: 'e3', source: 'script-1', target: 'thumbnail-1', type: 'animated', data: { sourceColor: '#a855f7', targetColor: '#ec4899' } },
  { id: 'e4', source: 'voice-1', target: 'assembly-1', type: 'animated', data: { sourceColor: '#f59e0b', targetColor: '#10b981' } },
  { id: 'e5', source: 'thumbnail-1', target: 'assembly-1', type: 'animated', data: { sourceColor: '#ec4899', targetColor: '#10b981' } },
  { id: 'e6', source: 'assembly-1', target: 'publish-1', type: 'animated', data: { sourceColor: '#10b981', targetColor: '#ff0000' } },
]

function PipelineEditorInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string } | null>(null)

  // Handle node click to open panel
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    const data = node.data as unknown as PipelineNodeData
    if (data.nodeType && data.nodeType !== 'trigger') {
      setSelectedNode({ id: node.id, type: data.nodeType })
    }
  }, [])

  // Close panel
  const closePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source)
      const targetNode = nodes.find(n => n.id === params.target)
      const sourceData = sourceNode?.data as unknown as PipelineNodeData
      const targetData = targetNode?.data as unknown as PipelineNodeData

      const newEdge = {
        ...params,
        type: 'animated',
        data: {
          sourceColor: getNodeColor(sourceData?.nodeType || ''),
          targetColor: getNodeColor(targetData?.nodeType || ''),
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges, nodes]
  )

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const nodeType = event.dataTransfer.getData('application/reactflow')
      if (!nodeType) return

      const paletteNode = NODE_PALETTE.find((n) => n.id === nodeType)
      if (!paletteNode) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: 'pipeline',
        position,
        data: {
          label: paletteNode.name,
          subtitle: paletteNode.subtitle,
          nodeType: nodeType as PipelineNodeData['nodeType'],
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes]
  )

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    const sortedNodes = [...nodes].sort((a, b) => {
      const order = ['trigger', 'script', 'voice', 'thumbnail', 'assembly', 'publish']
      const aData = a.data as unknown as PipelineNodeData
      const bData = b.data as unknown as PipelineNodeData
      return order.indexOf(aData.nodeType) - order.indexOf(bData.nodeType)
    })

    const layoutedNodes = sortedNodes.map((node, index) => ({
      ...node,
      position: {
        x: 60 + (index * 240),
        y: 175 + (index % 2 === 0 ? 0 : -45),
      },
    }))

    setNodes(layoutedNodes)
  }, [nodes, setNodes])

  // Fit view
  const { fitView } = useReactFlow()
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 })
  }, [fitView])

  // Get ideation data
  const { topic, generatedHooks, selectedHookIds, generatedTitles, selectedTitleIds, editedDescription, archetype } = useIdeationStore()

  // Get run store actions
  const { startRun, startNode, completeNode, failNode, completeRun, failRun, addLog, status: runStatus, reset: resetRun } = useRunStore()

  // Run pipeline
  const handleRunPipeline = useCallback(async () => {
    // Get selected hook and title
    const selectedHook = generatedHooks.find(h => selectedHookIds.includes(h.id))
    const selectedTitle = generatedTitles.find(t => selectedTitleIds.includes(t.id))

    // Validate we have required data
    if (!topic) {
      alert('Please complete the Ideation flow first. Go to Ideation → enter a topic → select hook → select title.')
      return
    }

    // Use defaults if no selection
    const title = selectedTitle?.content || topic
    const hook = selectedHook?.content || ''
    const description = editedDescription || ''

    // Reset and start run
    resetRun()
    const runId = `run-${Date.now()}`
    startRun(runId)
    addLog({ level: 'info', message: `Starting pipeline for: ${title}` })

    try {
      // Call pipeline execute API with SSE
      const response = await fetch('/api/pipeline/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title,
          hook,
          description,
          archetype: archetype || 'listicle',
        }),
      })

      if (!response.ok) {
        throw new Error(`Pipeline failed: ${response.statusText}`)
      }

      // Process SSE stream
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              const nodeId = data.node as NodeId

              // Handle different event types
              if (data.status === 'running') {
                startNode(nodeId)
                addLog({ level: 'info', message: `${nodeId}: Starting...`, nodeId })
              } else if (data.status === 'completed') {
                completeNode(nodeId, data.data)
                addLog({ level: 'info', message: `${nodeId}: Completed`, nodeId })
              } else if (data.status === 'failed') {
                failNode(nodeId, data.data?.error || 'Unknown error')
                addLog({ level: 'error', message: `${nodeId}: Failed - ${data.data?.error}`, nodeId })
              }

              // Check for completion
              if (data.node === 'complete') {
                completeRun()
                addLog({ level: 'info', message: 'Pipeline completed successfully!' })
              } else if (data.node === 'error') {
                failRun(data.data?.error || 'Pipeline failed')
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e)
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      failRun(errorMessage)
      addLog({ level: 'error', message: `Pipeline error: ${errorMessage}` })
      alert(`Pipeline failed: ${errorMessage}`)
    }
  }, [topic, generatedHooks, selectedHookIds, generatedTitles, selectedTitleIds, editedDescription, archetype, resetRun, startRun, startNode, completeNode, failNode, completeRun, failRun, addLog])

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    let cost = 0
    nodes.forEach((node) => {
      const data = node.data as unknown as PipelineNodeData
      switch (data.nodeType) {
        case 'script': cost += 0.15; break
        case 'voice': cost += 0.20; break
        case 'thumbnail': cost += 0.05; break
        case 'assembly': cost += 0.03; break
        case 'publish': cost += 0.02; break
      }
    })
    return cost.toFixed(2)
  }, [nodes])

  return (
    <div className="editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Undo" onClick={() => alert('Undo')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.3 2.7L3 13"/>
            </svg>
          </button>
          <button className="toolbar-btn" title="Redo" onClick={() => alert('Redo')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.3 2.7L21 13"/>
            </svg>
          </button>
        </div>
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Auto Layout" onClick={handleAutoLayout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className="toolbar-btn" title="Fit View" onClick={handleFitView}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
          </button>
        </div>
        <div className="toolbar-group" style={{ marginLeft: 'auto', borderRight: 'none' }}>
          <div className="run-button-group">
            <button
              className="run-button-main"
              onClick={handleRunPipeline}
              disabled={runStatus === 'running'}
              style={{ opacity: runStatus === 'running' ? 0.7 : 1 }}
            >
              {runStatus === 'running' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
              {runStatus === 'running' ? 'Running...' : 'Run Pipeline'}
            </button>
            <button className="run-button-cost" title="Estimated API cost for this run">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              ~${estimatedCost}
            </button>
          </div>
        </div>
      </div>

      <div className="editor-container">
        {/* Node Palette */}
        <div className="node-palette">
          <div className="palette-title">Nodes</div>
          {NODE_PALETTE.map((node) => (
            <div
              key={node.id}
              className="palette-node"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', node.id)
                event.dataTransfer.effectAllowed = 'move'
                setIsDragging(true)
              }}
              onDragEnd={() => setIsDragging(false)}
              style={{ cursor: 'grab' }}
            >
              <div className="palette-node-icon" style={{ background: node.color }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d={node.icon} />
                </svg>
              </div>
              <span className="palette-node-name">{node.name}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="canvas-wrapper"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {/* YouTube Watermark */}
          <div className="youtube-watermark">
            <svg viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            style={{ background: 'transparent' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color="rgba(255,255,255,0.02)"
              gap={20}
              size={1}
            />
            <Controls
              showZoom={true}
              showFitView={false}
              showInteractive={false}
              position="bottom-left"
            />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as unknown as PipelineNodeData
                return getNodeColor(data?.nodeType || '')
              }}
              maskColor="rgba(0,0,0,0.8)"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              }}
              position="bottom-right"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Panel Drawer */}
      {selectedNode && (
        <div className="node-panel-drawer" style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '420px',
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease-out',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <button
              onClick={closePanel}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedNode.type === 'script' && <ScriptPanel />}
            {selectedNode.type === 'voice' && <VoicePanel />}
            {selectedNode.type === 'thumbnail' && <ThumbnailPanel />}
            {selectedNode.type === 'assembly' && <AssemblyPanel />}
            {selectedNode.type === 'publish' && <PublishPanel />}
          </div>
        </div>
      )}

      {/* CSS for animated edges and panel */}
      <style jsx global>{`
        @keyframes edgeFlow {
          to { stroke-dashoffset: -12; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .react-flow__node {
          cursor: move !important;
        }
        .react-flow__controls {
          background: var(--bg-surface) !important;
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          box-shadow: none !important;
        }
        .react-flow__controls-button {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--border) !important;
          color: var(--text-secondary) !important;
          fill: var(--text-secondary) !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__controls-button:hover {
          background: var(--bg-hover) !important;
        }
        .react-flow__controls-button svg {
          fill: var(--text-secondary) !important;
        }
        .react-flow__minimap {
          border-radius: 10px !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  )
}

export default function PipelineEditor() {
  return (
    <ReactFlowProvider>
      <PipelineEditorInner />
    </ReactFlowProvider>
  )
}
