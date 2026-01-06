'use client'

import { useCallback, useRef, useMemo, useEffect, useState } from 'react'
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import PipelineNode, { PipelineNodeData } from './PipelineNode'
import { useWorkflowStore } from '@/lib/stores/workflows'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: Record<string, any> = {
  pipeline: PipelineNode,
}

const NODE_PALETTE = [
  { id: 'trigger', name: 'Trigger', subtitle: 'Topic Input', color: '#22d3ee', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'script', name: 'Script', subtitle: 'Claude AI', color: '#a78bfa', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { id: 'voice', name: 'Voice', subtitle: 'ElevenLabs', color: '#f472b6', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' },
  { id: 'thumbnail', name: 'Thumbnail', subtitle: 'Imagen 4.0', color: '#fbbf24', icon: 'M3 3h18v18H3z' },
  { id: 'assembly', name: 'Assembly', subtitle: 'FFmpeg', color: '#34d399', icon: 'M23 7l-7 5 7 5V7z' },
  { id: 'publish', name: 'Publish', subtitle: 'YouTube', color: '#f87171', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
]

// Default pipeline for demo mode
const DEFAULT_NODES: Node[] = [
  { id: 'trigger-1', type: 'pipeline', position: { x: 50, y: 200 }, data: { label: 'Trigger', subtitle: 'Topic Input', nodeType: 'trigger' } },
  { id: 'script-1', type: 'pipeline', position: { x: 250, y: 200 }, data: { label: 'Script', subtitle: 'Claude AI', nodeType: 'script' } },
  { id: 'voice-1', type: 'pipeline', position: { x: 450, y: 120 }, data: { label: 'Voice', subtitle: 'ElevenLabs', nodeType: 'voice' } },
  { id: 'thumbnail-1', type: 'pipeline', position: { x: 450, y: 280 }, data: { label: 'Thumbnail', subtitle: 'Imagen 4.0', nodeType: 'thumbnail' } },
  { id: 'assembly-1', type: 'pipeline', position: { x: 650, y: 200 }, data: { label: 'Assembly', subtitle: 'FFmpeg', nodeType: 'assembly' } },
  { id: 'publish-1', type: 'pipeline', position: { x: 850, y: 200 }, data: { label: 'Publish', subtitle: 'YouTube', nodeType: 'publish' } },
]

const DEFAULT_EDGES: Edge[] = [
  { id: 'e1', source: 'trigger-1', target: 'script-1', animated: true, style: { stroke: '#22d3ee' } },
  { id: 'e2', source: 'script-1', target: 'voice-1', animated: true, style: { stroke: '#a78bfa' } },
  { id: 'e3', source: 'script-1', target: 'thumbnail-1', animated: true, style: { stroke: '#a78bfa' } },
  { id: 'e4', source: 'voice-1', target: 'assembly-1', animated: true, style: { stroke: '#f472b6' } },
  { id: 'e5', source: 'thumbnail-1', target: 'assembly-1', animated: true, style: { stroke: '#fbbf24' } },
  { id: 'e6', source: 'assembly-1', target: 'publish-1', animated: true, style: { stroke: '#34d399' } },
]

function PipelineEditorInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES)
  const [isDirty, setIsDirty] = useState(false)

  // Workflow store for persistence
  const { currentWorkflow, setNodes: storeSetNodes, setEdges: storeSetEdges, saveWorkflow } = useWorkflowStore()

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#666' } }, eds))
      setIsDirty(true)
    },
    [setEdges]
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
      setIsDirty(true)
    },
    [screenToFlowPosition, setNodes]
  )

  // Handle node deletion
  const onNodesDelete = useCallback(() => {
    setIsDirty(true)
  }, [])

  // Handle edge deletion
  const onEdgesDelete = useCallback(() => {
    setIsDirty(true)
  }, [])

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
        x: 50 + (index * 200),
        y: 200 + (index % 2 === 0 ? 0 : 80),
      },
    }))

    setNodes(layoutedNodes)
    setIsDirty(true)
  }, [nodes, setNodes])

  // Fit view
  const { fitView } = useReactFlow()
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 })
  }, [fitView])

  // Run pipeline (placeholder)
  const handleRunPipeline = useCallback(() => {
    alert('Pipeline run would start here! This will trigger the execution of all nodes in sequence.')
  }, [])

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    let cost = 0
    nodes.forEach((node) => {
      switch (node.data.nodeType) {
        case 'script': cost += 0.10; break
        case 'voice': cost += 0.15; break
        case 'thumbnail': cost += 0.05; break
        case 'assembly': cost += 0.05; break
        case 'publish': cost += 0.10; break
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
            <button className="run-button-main" onClick={handleRunPipeline}>
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
              }}
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
        <div className="canvas-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            nodeTypes={NODE_TYPES}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            style={{ background: 'var(--bg, #0f0f1a)' }}
          >
            <Background color="#333" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  trigger: '#22d3ee',
                  script: '#a78bfa',
                  voice: '#f472b6',
                  thumbnail: '#fbbf24',
                  assembly: '#34d399',
                  publish: '#f87171',
                }
                return colors[(node.data as unknown as PipelineNodeData)?.nodeType] || '#666'
              }}
              style={{ background: '#1a1a2e' }}
            />
          </ReactFlow>
        </div>
      </div>
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
