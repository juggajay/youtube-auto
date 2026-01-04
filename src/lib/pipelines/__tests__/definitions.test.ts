import { describe, it, expect } from 'vitest';
import { PIPELINE_DEFINITIONS, loadPipelineDefinition } from '../definitions';

describe('Pipeline Definitions', () => {
  it('contains full-video pipeline', () => {
    expect(PIPELINE_DEFINITIONS['full-video']).toBeDefined();
    expect(PIPELINE_DEFINITIONS['full-video'].nodes.length).toBeGreaterThan(0);
  });

  it('contains script-only pipeline', () => {
    expect(PIPELINE_DEFINITIONS['script-only']).toBeDefined();
  });

  it('loadPipelineDefinition returns correct pipeline', () => {
    const pipeline = loadPipelineDefinition('full-video');
    expect(pipeline.id).toBe('full-video');
  });

  it('loadPipelineDefinition throws for unknown pipeline', () => {
    expect(() => loadPipelineDefinition('nonexistent')).toThrow('Unknown pipeline');
  });

  it('full-video pipeline has correct dependency chain', () => {
    const pipeline = PIPELINE_DEFINITIONS['full-video'];
    const scriptNode = pipeline.nodes.find(n => n.nodeId === 'script');
    expect(scriptNode?.dependsOn).toContain('research');
  });
});
