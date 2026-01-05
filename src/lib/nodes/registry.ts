import type { NodeContract } from './base';

export class NodeRegistry {
  private nodes: Map<string, NodeContract<any, any, any>> = new Map();

  register(node: NodeContract<any, any, any>): void {
    if (this.nodes.has(node.meta.id)) {
      throw new Error(`Node '${node.meta.id}' is already registered`);
    }
    this.nodes.set(node.meta.id, node);
  }

  get(id: string): NodeContract<any, any, any> | undefined {
    return this.nodes.get(id);
  }

  has(id: string): boolean {
    return this.nodes.has(id);
  }

  list(): NodeContract<any, any, any>[] {
    return Array.from(this.nodes.values());
  }

  listByCategory(category: string): NodeContract<any, any, any>[] {
    return this.list().filter(node => node.meta.category === category);
  }
}

// Singleton instance
export const nodeRegistry = new NodeRegistry();

// Auto-register built-in nodes
import { TriggerNode } from './trigger';
import { ScriptGeneratorNode } from './script';
import { VoiceGeneratorNode } from './voice';
import { ThumbnailGeneratorNode } from './thumbnail';
import { AssemblyNode } from './assembly';

nodeRegistry.register(new TriggerNode());
nodeRegistry.register(new ScriptGeneratorNode());
nodeRegistry.register(new VoiceGeneratorNode());
nodeRegistry.register(new ThumbnailGeneratorNode());
nodeRegistry.register(new AssemblyNode());
