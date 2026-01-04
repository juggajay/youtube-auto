import type { PipelineDefinition } from './types';

export const PIPELINE_DEFINITIONS: Record<string, PipelineDefinition> = {
  'full-video': {
    id: 'full-video',
    name: 'Full Video Production',
    description: 'Complete pipeline from topic to published video',
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'research', id: 'research', dependsOn: ['trigger'] },
      { nodeId: 'script', id: 'script', dependsOn: ['research'] },
      { nodeId: 'voice', id: 'voice', dependsOn: ['script'] },
      { nodeId: 'thumbnail', id: 'thumbnail', dependsOn: ['script'] },
      { nodeId: 'assembly', id: 'assembly', dependsOn: ['voice', 'thumbnail'] },
      { nodeId: 'publish', id: 'publish', dependsOn: ['assembly'] },
    ],
  },

  'script-only': {
    id: 'script-only',
    name: 'Script Generation Only',
    description: 'Generate just the script',
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'research', id: 'research', dependsOn: ['trigger'] },
      { nodeId: 'script', id: 'script', dependsOn: ['research'] },
    ],
  },

  'script-to-voice': {
    id: 'script-to-voice',
    name: 'Script + Voice',
    description: 'Generate script and voice audio',
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'research', id: 'research', dependsOn: ['trigger'] },
      { nodeId: 'script', id: 'script', dependsOn: ['research'] },
      { nodeId: 'voice', id: 'voice', dependsOn: ['script'] },
    ],
  },

  'thumbnail-only': {
    id: 'thumbnail-only',
    name: 'Thumbnail Generation Only',
    description: 'Generate just thumbnails',
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'thumbnail', id: 'thumbnail', dependsOn: ['trigger'] },
    ],
  },

  'assemble-and-publish': {
    id: 'assemble-and-publish',
    name: 'Assemble & Publish',
    description: 'Assemble video from provided assets and publish',
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'assembly', id: 'assembly', dependsOn: ['trigger'] },
      { nodeId: 'publish', id: 'publish', dependsOn: ['assembly'] },
    ],
  },
};

export function loadPipelineDefinition(pipelineId: string): PipelineDefinition {
  const pipeline = PIPELINE_DEFINITIONS[pipelineId];
  if (!pipeline) {
    throw new Error(`Unknown pipeline: ${pipelineId}`);
  }
  return pipeline;
}
