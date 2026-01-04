import type { RunContext } from '@/lib/nodes/context';

export interface PipelineDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: PipelineNodeConfig[];
}

export interface PipelineNodeConfig {
  nodeId: string;
  id: string;
  dependsOn?: string[];
  condition?: (context: RunContext) => boolean;
}
