# VidFlow Node Architecture Design

> **Status:** Draft
> **Last Updated:** 2026-01-05
> **Authors:** Design collaboration session

---

## 1. Overview

VidFlow is a modular YouTube video production pipeline. Users connect nodes (trigger → script → voice → thumbnail → assembly → publish) to automate any part of their workflow.

**Core Principles:**
- Full automation is possible, but every node can be customized, skipped, or manually overridden
- Configuration cascades from system defaults → user → project → template → run overrides
- Runs are resumable — user can close browser and continue later
- Nodes are stateless — no instance properties that vary per-run

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Project     │  │ Run         │  │ Intervention│  │ Output      │    │
│  │ Config UI   │  │ Dashboard   │  │ Review UI   │  │ Viewer      │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼───────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                   │
│  POST /api/runs           POST /api/runs/:id/intervene                  │
│  GET  /api/runs/:id       POST /api/runs/:id/resume                     │
│  POST /api/runs/:id/cancel                                               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PIPELINE ORCHESTRATOR                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ • Resolves config cascade                                        │   │
│  │ • Executes nodes in dependency order                             │   │
│  │ • Handles intervention pause/resume                              │   │
│  │ • Persists state after each node                                 │   │
│  │ • Manages retries and error recovery                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  TRIGGER NODE │          │  SCRIPT NODE  │          │  VOICE NODE   │
│               │          │               │          │               │
│ • Manual      │─────────▶│ • Claude API  │─────────▶│ • ElevenLabs  │
│ • Scheduled   │          │ • Archetype   │          │ • PlayHT      │
│ • Webhook     │          │ • Ch. Bible   │          │ • OpenAI TTS  │
└───────────────┘          └───────────────┘          └───────┬───────┘
                                                              │
        ┌─────────────────────────────────────────────────────┤
        ▼                            ▼                        ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ THUMBNAIL NODE│          │ ASSEMBLY NODE │          │ PUBLISH NODE  │
│               │          │               │          │               │
│ • Gemini      │─────────▶│ • FFmpeg      │─────────▶│ • YouTube API │
│ • Templates   │          │ • Ken Burns   │          │ • Scheduling  │
│ • CTR Analysis│          │ • Captions    │          │ • Metadata    │
└───────────────┘          └───────────────┘          └───────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PERSISTENCE LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Supabase    │  │ Supabase    │  │ Supabase    │  │ Run State   │    │
│  │ Auth        │  │ Database    │  │ Storage     │  │ (JSON)      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Node Contract Specification

All nodes implement a common contract ensuring consistent behavior, validation, and execution.

### 2.1 Base Types

```typescript
// lib/nodes/base.ts

import { z, ZodSchema } from 'zod';

// === Credential Types ===

export type CredentialType =
  | 'elevenlabs'
  | 'playht'
  | 'openai'
  | 'youtube'
  | 'anthropic'    // Provided by platform
  | 'gemini'       // Provided by platform
  | 'pexels'
  | 'storyblocks';

// === Node Categories ===

export type NodeCategory = 'trigger' | 'content' | 'production' | 'publish';

// === Node Metadata ===

export interface NodeMeta {
  id: string;                             // 'script', 'voice', etc.
  name: string;                           // 'Script Generator'
  description: string;
  icon: string;                           // Lucide icon name
  category: NodeCategory;
  requiredCredentials: CredentialType[];
  estimatedDuration: string;              // "30s - 2min"
}

// === Validation ===

export interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

// === Cost Estimation ===

export interface CostEstimate {
  estimated: boolean;
  breakdown: {
    service: string;
    units: number;
    unitType: string;           // 'characters', 'tokens', 'images'
    cost: number;               // USD
  }[];
  total: number;
  confidence: 'low' | 'medium' | 'high';
}

// === Execution ===

export interface ExecutionOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ProgressUpdate) => void;
  onLog?: (entry: LogEntry) => void;
}

export interface ProgressUpdate {
  percent: number;              // 0-100
  message: string;
  stage?: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// === Results ===

export type NodeResult<T> =
  | { success: true; output: T; metadata: ExecutionMetadata }
  | { success: false; error: NodeError; partialOutput?: Partial<T> };

export interface ExecutionMetadata {
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  actualCost: CostEstimate;
  apiCalls: ApiCallLog[];
}

export interface ApiCallLog {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestedAt: Date;
  respondedAt: Date;
  durationMs: number;
  status: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export interface NodeError {
  code: string;                 // 'RATE_LIMIT', 'INVALID_INPUT', etc.
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

### 2.2 Node Contract Interface

```typescript
// lib/nodes/base.ts (continued)

export interface NodeContract<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
  TConfig extends z.ZodTypeAny
> {
  // === Identity ===
  meta: NodeMeta;

  // === Schemas ===
  inputSchema: TInput;
  outputSchema: TOutput;
  configSchema: TConfig;

  // === Lifecycle Methods ===

  /**
   * Validate inputs before execution.
   */
  validate(
    input: z.infer<TInput>,
    config: z.infer<TConfig>,
    context: RunContext
  ): ValidationResult;

  /**
   * Estimate cost before execution.
   */
  estimateCost(
    input: z.infer<TInput>,
    config: z.infer<TConfig>
  ): CostEstimate;

  /**
   * Execute the node. Must be stateless.
   */
  execute(
    input: z.infer<TInput>,
    config: z.infer<TConfig>,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<z.infer<TOutput>>>;

  /**
   * Extract input from run context (for orchestrator).
   * If not implemented, orchestrator passes all previousOutputs.
   */
  getInputFromContext?(context: RunContext): z.infer<TInput>;

  // === Optional Hooks ===

  /**
   * Transform input/config before execution.
   */
  beforeExecute?(
    input: z.infer<TInput>,
    config: z.infer<TConfig>,
    context: RunContext
  ): Promise<{ input: z.infer<TInput>; config: z.infer<TConfig> }>;

  /**
   * Transform output after execution.
   */
  afterExecute?(
    output: z.infer<TOutput>,
    context: RunContext
  ): Promise<z.infer<TOutput>>;
}
```

### 2.3 Implementation Rules

| Rule | Rationale |
|------|-----------|
| **Nodes are stateless** | Instances may be reused across concurrent runs |
| **All run data via context** | Enables persistence and resumption |
| **Local variables only** | No `this.property` for run-specific data |
| **Zod schemas required** | Runtime validation, type inference |
| **Cost estimation required** | User approval before expensive operations |

---

## 3. Run Context & Config Resolution

### 3.1 Run Context

The `RunContext` is passed to every node, containing everything needed for execution.

```typescript
// lib/nodes/context.ts

export interface RunContext {
  // === Identifiers ===
  runId: string;
  projectId: string;
  userId: string;

  // === Run State ===
  status: RunStatus;
  startedAt: Date;
  currentNode: string | null;
  completedNodes: string[];
  skippedNodes: string[];

  // === Retry Tracking ===
  retry: {
    attemptNumber: number;
    maxAttempts: number;
    lastError?: NodeError;
  };

  // === Accumulated Outputs ===
  previousOutputs: {
    trigger?: TriggerOutput;
    research?: ResearchOutput;
    script?: ScriptOutput;
    voice?: VoiceOutput;
    thumbnail?: ThumbnailOutput;
    assembly?: AssemblyOutput;
    [nodeId: string]: unknown;      // Custom nodes
  };
}

// === Node Output Types ===

export interface TriggerOutput {
  topic: string;
  archetypeId: string;
  sourceType: 'manual' | 'scheduled' | 'webhook' | 'nicheradar';
  sourceData?: Record<string, unknown>;  // NicheRadar gap score, webhook payload, etc.
}

export interface ResearchOutput {
  summary: string;
  keyPoints: string[];
  sources: { title: string; url: string; snippet: string }[];
  comparisons?: Record<string, unknown>;  // For VS Battle archetype
  recentDevelopments?: string[];
}

export interface VoiceOutput {
  segments: {
    id: string;
    file: string;           // Storage path
    duration: number;       // Seconds
    text: string;           // Original script text
  }[];
  totalDuration: number;
}

export interface ThumbnailOutput {
  selected: string;         // Storage path of selected thumbnail
  options: {
    file: string;
    ctrScore?: number;      // Predicted CTR if analysis enabled
  }[];
}

export interface AssemblyOutput {
  videoFile: string;        // Storage path
  subtitleFile?: string;    // .srt path
  duration: number;
  resolution: string;
}

export interface RunContext {
  // ... (continued from above)

  // === Resolved Configuration ===
  config: ResolvedConfig;

  // === Services (Dependency Injection) ===
  services: {
    db: DatabaseClient;
    storage: StorageClient;
    credentials: CredentialManager;
    logger: Logger;
  };

  // === Run Overrides ===
  runOverrides: {
    instructions?: string;
    skipNodes?: string[];
    nodeOverrides?: Record<string, unknown>;
  };
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'awaiting_review'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

### 3.2 Configuration Hierarchy

Configuration cascades from general to specific:

```
┌─────────────────────────────────────────┐
│ SYSTEM DEFAULTS                         │
│ • Default model: claude-sonnet-4-20250514       │
│ • Default voice speed: 1.0              │
│ • Default resolution: 1080p             │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ USER DEFAULTS                           │
│ • Preferred LLM provider                │
│ • API keys                              │
│ • Default language                      │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ PROJECT DEFAULTS                        │
│ • Channel bible                         │
│ • Brand guidelines                      │
│ • Voice ID                              │
│ • Thumbnail style                       │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ TEMPLATE DEFAULTS                       │
│ • Fixed structure                       │
│ • Fixed assets                          │
│ • Prompt modifications                  │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ RUN OVERRIDES                           │
│ • "Make this more casual"               │
│ • "Skip thumbnail generation"           │
│ • "Use different voice"                 │
└─────────────────────────────────────────┘
```

### 3.3 Config Resolution Implementation

```typescript
// lib/config/resolve.ts

export interface ConfigSource {
  level: ConfigLevel;
  config: Partial<ResolvedConfig>;
}

export type ConfigLevel = 'system' | 'user' | 'project' | 'template' | 'run';

const LEVEL_ORDER: ConfigLevel[] = ['system', 'user', 'project', 'template', 'run'];

/**
 * Deep merge with explicit rules:
 * - Primitives: later wins
 * - Arrays: later replaces entirely (no concat)
 * - Objects: recurse and merge
 * - null/undefined in later: keeps earlier value (no accidental wipes)
 */
function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    const baseValue = base[key];

    if (overrideValue === null || overrideValue === undefined) {
      continue;  // Keep base value
    }

    if (Array.isArray(overrideValue)) {
      result[key] = overrideValue as T[keyof T];
      continue;
    }

    if (
      typeof overrideValue === 'object' &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[keyof T];
      continue;
    }

    result[key] = overrideValue as T[keyof T];
  }

  return result;
}

export function resolveConfig(sources: ConfigSource[]): ResolvedConfig {
  const sorted = sources.sort((a, b) =>
    LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  );

  const resolved = sorted.reduce(
    (acc, source) => deepMerge(acc, source.config as Record<string, unknown>),
    getSystemDefaults() as Record<string, unknown>
  ) as ResolvedConfig;

  const validation = validateResolvedConfig(resolved);
  if (!validation.valid) {
    throw new ConfigResolutionError(validation.errors);
  }

  return resolved;
}

function validateResolvedConfig(config: ResolvedConfig): ValidationResult {
  const errors: { field: string; message: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  if (config.voice.provider && !config.voice.voiceId) {
    errors.push({
      field: 'voice.voiceId',
      message: 'Voice ID required when provider is set'
    });
  }

  if (config.publish.platform === 'youtube' && !config.publish.channel_id) {
    errors.push({
      field: 'publish.channel_id',
      message: 'YouTube channel ID required for publishing'
    });
  }

  if (!config.channelBible.channel_name) {
    warnings.push({
      field: 'channelBible.channel_name',
      message: 'Channel name not set'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### 3.4 Intervention Configuration

```typescript
export interface InterventionConfig {
  nodes: {
    trigger: InterventionLevel;
    research: InterventionLevel;
    script: InterventionLevel;
    voice: InterventionLevel;
    thumbnail: InterventionLevel;
    assembly: InterventionLevel;
    publish: InterventionLevel;
    [nodeId: string]: InterventionLevel;
  };

  defaults: {
    pauseOnError: boolean;
    notifyOnComplete: boolean;
    autoApproveTimeout?: number;
  };
}

export type InterventionLevel =
  | 'auto'            // Proceed automatically
  | 'review'          // Show output, require approval
  | 'always_review';  // Always stop, even in auto runs

export type InterventionAction =
  | { type: 'approve' }
  | { type: 'approve_with_edits'; edits: unknown }
  | { type: 'regenerate' }
  | { type: 'regenerate_with_feedback'; feedback: string }
  | { type: 'skip'; manualInput?: unknown }
  | { type: 'pause' }
  | { type: 'cancel' };
```

---

## 4. Pipeline Orchestrator

The orchestrator manages the full run lifecycle: config resolution, node execution, intervention handling, and state persistence.

### 4.1 Types

```typescript
// lib/orchestrator/types.ts

export interface PipelineDefinition {
  id: string;
  name: string;
  nodes: PipelineNodeConfig[];
}

export interface PipelineNodeConfig {
  nodeId: string;                    // References node registry
  id: string;                        // Instance ID (unique within pipeline)
  dependsOn?: string[];              // Node IDs that must complete first
  condition?: (context: RunContext) => boolean;
}

export interface RunOptions {
  signal?: AbortSignal;
  onProgress?: (update: RunProgressUpdate) => void;
  onNodeComplete?: (nodeId: string, result: NodeResult<unknown>) => void;
  onIntervention?: (nodeId: string, output: unknown) => void;
}

export interface RunProgressUpdate {
  runId: string;
  status: RunStatus;
  currentNode: string | null;
  completedNodes: string[];
  overallPercent: number;
  nodeProgress?: { percent: number; message: string };
}

export type InterventionResponse =
  | { action: 'approve' }
  | { action: 'approve_with_edits'; edits: unknown }
  | { action: 'regenerate' }
  | { action: 'regenerate_with_feedback'; feedback: string }
  | { action: 'skip'; manualInput?: unknown }
  | { action: 'cancel' };
```

### 4.2 Orchestrator Implementation

```typescript
// lib/orchestrator/index.ts

import { EventEmitter } from 'events';

export class PipelineOrchestrator extends EventEmitter {
  private context: RunContext;
  private pipeline: PipelineDefinition;
  private options: RunOptions;

  // Intervention handling (race-safe)
  private interventionQueue: InterventionResponse[] = [];
  private pendingIntervention: {
    nodeId: string;
    output: unknown;
    resolve: (response: InterventionResponse) => void;
  } | null = null;

  constructor(
    pipeline: PipelineDefinition,
    configSources: ConfigSource[],
    userId: string,
    projectId: string,
    options: RunOptions = {}
  ) {
    super();
    this.pipeline = pipeline;
    this.options = options;

    const resolvedConfig = resolveConfig(configSources);
    this.context = createRunContext({ userId, projectId, config: resolvedConfig });
  }

  // === Resume Existing Run ===

  static async resume(runId: string, options: RunOptions = {}): Promise<PipelineOrchestrator> {
    const savedState = await loadRunState(runId);
    if (!savedState) throw new Error(`Run not found: ${runId}`);

    const orchestrator = new PipelineOrchestrator(
      savedState.pipeline,
      [],
      savedState.context.userId,
      savedState.context.projectId,
      options
    );
    orchestrator.context = savedState.context;
    return orchestrator;
  }

  // === Main Execution ===

  async run(): Promise<RunContext> {
    this.context.status = 'running';
    await this.persistState();
    this.emitProgress();

    try {
      const executionOrder = this.resolveExecutionOrder();

      for (const nodeConfig of executionOrder) {
        if (this.options.signal?.aborted) {
          this.context.status = 'cancelled';
          await this.persistState();
          break;
        }

        if (this.context.completedNodes.includes(nodeConfig.id)) continue;

        if (nodeConfig.condition && !nodeConfig.condition(this.context)) {
          this.context.skippedNodes.push(nodeConfig.id);
          await this.persistState();
          continue;
        }

        if (this.context.runOverrides.skipNodes?.includes(nodeConfig.id)) {
          this.context.skippedNodes.push(nodeConfig.id);
          await this.persistState();
          continue;
        }

        await this.executeNode(nodeConfig);

        if (this.context.status === 'awaiting_review') {
          await this.persistState();
          return this.context;
        }
      }

      if (this.context.status === 'running') {
        this.context.status = 'completed';
        await this.persistState();
      }

    } catch (error) {
      this.context.status = 'failed';
      await this.persistState();
      throw error;
    }

    return this.context;
  }

  // === Node Execution (Loop-Based, No Recursion) ===

  private async executeNode(nodeConfig: PipelineNodeConfig): Promise<void> {
    const node = nodeRegistry.get(nodeConfig.nodeId);
    if (!node) throw new Error(`Node not found: ${nodeConfig.nodeId}`);

    this.context.currentNode = nodeConfig.id;
    await this.persistState();
    this.emitProgress();

    let shouldContinue = true;

    while (shouldContinue) {
      this.context.retry = { attemptNumber: 1, maxAttempts: 3, lastError: undefined };

      const result = await this.executeWithRetries(node, nodeConfig);

      if (!result.success) {
        if (this.context.config.intervention.defaults.pauseOnError) {
          this.context.status = 'awaiting_review';
          await this.persistState();

          const response = await this.waitForIntervention(nodeConfig.id, result);

          if (response.action === 'regenerate' || response.action === 'regenerate_with_feedback') {
            if (response.action === 'regenerate_with_feedback') {
              this.appendInstructions(response.feedback);
            }
            continue;
          } else if (response.action === 'skip') {
            this.handleSkip(nodeConfig, response.manualInput);
            shouldContinue = false;
          } else if (response.action === 'cancel') {
            this.context.status = 'cancelled';
            shouldContinue = false;
          }
        } else {
          throw new NodeExecutionError(nodeConfig.id, result.error);
        }
        continue;
      }

      // Success
      this.context.previousOutputs[nodeConfig.id] = result.output;

      const interventionLevel = this.getInterventionLevel(nodeConfig.nodeId);

      if (interventionLevel === 'auto') {
        this.context.completedNodes.push(nodeConfig.id);
        this.options.onNodeComplete?.(nodeConfig.id, result);
        shouldContinue = false;

      } else {
        this.context.status = 'awaiting_review';
        await this.persistState();

        const response = await this.waitForIntervention(nodeConfig.id, result.output);

        switch (response.action) {
          case 'approve':
            this.context.completedNodes.push(nodeConfig.id);
            this.context.status = 'running';
            shouldContinue = false;
            break;
          case 'approve_with_edits':
            this.context.previousOutputs[nodeConfig.id] = response.edits;
            this.context.completedNodes.push(nodeConfig.id);
            this.context.status = 'running';
            shouldContinue = false;
            break;
          case 'regenerate':
            this.context.status = 'running';
            break;
          case 'regenerate_with_feedback':
            this.appendInstructions(response.feedback);
            this.context.status = 'running';
            break;
          case 'skip':
            this.handleSkip(nodeConfig, response.manualInput);
            shouldContinue = false;
            break;
          case 'cancel':
            this.context.status = 'cancelled';
            shouldContinue = false;
            break;
        }
      }
    }

    this.context.currentNode = null;
    await this.persistState();
  }

  // === Retry Logic ===

  private async executeWithRetries(
    node: NodeContract<any, any, any>,
    nodeConfig: PipelineNodeConfig
  ): Promise<NodeResult<unknown>> {
    const input = this.buildNodeInput(nodeConfig);
    const config = this.getNodeConfig(nodeConfig);

    let result: NodeResult<unknown> = {
      success: false,
      error: { code: 'NO_ATTEMPTS', message: 'No execution attempts made', retryable: false },
    };

    while (this.context.retry.attemptNumber <= this.context.retry.maxAttempts) {
      result = await node.execute(input, config, this.context, {
        signal: this.options.signal,
        onProgress: (progress) => this.emitProgress(progress),
        onLog: (entry) => this.context.services.logger.log(entry.level, entry.message, entry.data),
      });

      if (result.success) break;
      if (!result.error.retryable) break;
      if (this.context.retry.attemptNumber >= this.context.retry.maxAttempts) break;

      this.context.retry.attemptNumber++;
      this.context.retry.lastError = result.error;
      await this.persistState();
    }

    return result;
  }

  // === Intervention (Race-Safe) ===

  async respondToIntervention(response: InterventionResponse): Promise<void> {
    if (this.pendingIntervention) {
      this.pendingIntervention.resolve(response);
      this.pendingIntervention = null;
    } else {
      this.interventionQueue.push(response);
    }
  }

  private async waitForIntervention(nodeId: string, output: unknown): Promise<InterventionResponse> {
    if (this.interventionQueue.length > 0) {
      return this.interventionQueue.shift()!;
    }

    return new Promise((resolve) => {
      this.pendingIntervention = { nodeId, output, resolve };
      this.options.onIntervention?.(nodeId, output);
      this.emit('intervention', { nodeId, output });
    });
  }

  // === Input Building (Delegated to Nodes) ===

  private buildNodeInput(nodeConfig: PipelineNodeConfig): unknown {
    const node = nodeRegistry.get(nodeConfig.nodeId);

    if (node.getInputFromContext) {
      return node.getInputFromContext(this.context);
    }

    return {
      ...this.context.previousOutputs,
      runOverrides: this.context.runOverrides,
    };
  }

  // === Helpers ===

  private resolveExecutionOrder(): PipelineNodeConfig[] {
    // Topological sort based on dependsOn
    const order: PipelineNodeConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeConfig: PipelineNodeConfig) => {
      if (visited.has(nodeConfig.id)) return;
      if (visiting.has(nodeConfig.id)) {
        throw new Error(`Circular dependency: ${nodeConfig.id}`);
      }

      visiting.add(nodeConfig.id);
      for (const depId of nodeConfig.dependsOn || []) {
        const dep = this.pipeline.nodes.find(n => n.id === depId);
        if (dep) visit(dep);
      }
      visiting.delete(nodeConfig.id);
      visited.add(nodeConfig.id);
      order.push(nodeConfig);
    };

    for (const nodeConfig of this.pipeline.nodes) {
      visit(nodeConfig);
    }
    return order;
  }

  private getNodeConfig(nodeConfig: PipelineNodeConfig): unknown {
    const baseConfig = this.context.config[nodeConfig.nodeId as keyof ResolvedConfig];
    const overrides = this.context.runOverrides.nodeOverrides?.[nodeConfig.id];
    return overrides ? { ...baseConfig, ...overrides } : baseConfig;
  }

  private getInterventionLevel(nodeId: string): InterventionLevel {
    return this.context.config.intervention.nodes[nodeId] || 'auto';
  }

  private appendInstructions(feedback: string): void {
    this.context.runOverrides.instructions =
      (this.context.runOverrides.instructions || '') + '\n\nUser feedback: ' + feedback;
  }

  private handleSkip(nodeConfig: PipelineNodeConfig, manualInput?: unknown): void {
    if (manualInput) {
      this.context.previousOutputs[nodeConfig.id] = manualInput;
    }
    this.context.skippedNodes.push(nodeConfig.id);
    this.context.status = 'running';
  }

  private async persistState(): Promise<void> {
    await persistRunState(this.context.runId, {
      context: this.context,
      pipeline: this.pipeline,
    });
  }

  private emitProgress(nodeProgress?: { percent: number; message: string }): void {
    const completedCount = this.context.completedNodes.length;
    const totalCount = this.pipeline.nodes.length;

    const update: RunProgressUpdate = {
      runId: this.context.runId,
      status: this.context.status,
      currentNode: this.context.currentNode,
      completedNodes: this.context.completedNodes,
      overallPercent: Math.round((completedCount / totalCount) * 100),
      nodeProgress,
    };

    this.options.onProgress?.(update);
    this.emit('progress', update);
  }

  get runId(): string { return this.context.runId; }
  get status(): RunStatus { return this.context.status; }
}
```

---

## 5. Reference Implementation: Script Node

The script generator is the most complex node, demonstrating all contract features.

### 5.1 Schemas

```typescript
// lib/nodes/script/types.ts

import { z } from 'zod';

export const ScriptInputSchema = z.object({
  topic: z.string().min(3).max(200),
  archetypeId: z.string(),
  research: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
  }).optional(),
  instructions: z.string().optional(),
});

export const ScriptConfigSchema = z.object({
  model: z.enum([
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'gpt-4o'
  ]).default('claude-sonnet-4-20250514'),
  targetDuration: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  styleOverrides: z.object({
    toneAdjustment: z.string().optional(),
    additionalPhrases: z.array(z.string()).optional(),
  }).optional(),
  exampleScripts: z.array(z.object({
    name: z.string(),
    script: z.string(),
    notes: z.string(),
  })).optional(),
  temperature: z.number().min(0).max(1).default(0.7),
});

export const ScriptOutputSchema = z.object({
  title: z.string(),
  hook: z.object({
    text: z.string(),
    durationEstimate: z.number(),
    visualNotes: z.string(),
  }),
  sections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    archetypeSectionId: z.string().optional(),
    script: z.string(),
    durationEstimate: z.number(),
    visualNotes: z.string(),
    bRollSuggestions: z.array(z.string()),
  })),
  outro: z.object({
    text: z.string(),
    cta: z.string(),
  }),
  metadata: z.object({
    descriptionDraft: z.string(),
    tags: z.array(z.string()),
    chapters: z.array(z.object({
      timestamp: z.string(),
      title: z.string(),
    })),
  }),
  totalDurationEstimate: z.number(),
  wordCount: z.number(),
});
```

### 5.2 Implementation

```typescript
// lib/nodes/script/index.ts

export class ScriptGeneratorNode implements NodeContract<
  typeof ScriptInputSchema,
  typeof ScriptOutputSchema,
  typeof ScriptConfigSchema
> {
  meta: NodeMeta = {
    id: 'script',
    name: 'Script Generator',
    description: 'Generates video scripts from topic, archetype, and channel bible',
    icon: 'FileText',
    category: 'content',
    requiredCredentials: ['anthropic'],
    estimatedDuration: '30s - 2min',
  };

  inputSchema = ScriptInputSchema;
  outputSchema = ScriptOutputSchema;
  configSchema = ScriptConfigSchema;

  // === Stateless: Input from Context ===

  getInputFromContext(context: RunContext): z.infer<typeof ScriptInputSchema> {
    return {
      topic: context.previousOutputs.trigger?.topic ?? '',
      archetypeId: context.previousOutputs.trigger?.archetypeId ?? 'explainer',
      research: context.previousOutputs.research,
      instructions: context.runOverrides.instructions,
    };
  }

  // === Validation ===

  validate(input, config, context): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    if (input.topic.length < 10) {
      warnings.push({ field: 'topic', message: 'Topic is very short' });
    }

    if (!context.config.channelBible.target_audience.demographics) {
      warnings.push({ field: 'channelBible', message: 'No target audience defined' });
    }

    if (!input.research && input.topic.toLowerCase().includes(' vs ')) {
      warnings.push({ field: 'research', message: 'Comparison without research' });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===

  estimateCost(input, config): CostEstimate {
    const promptTokens = estimateTokens({ topic: input.topic, research: input.research });
    const outputTokens = 2000;

    const costs = {
      'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
      'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
      'gpt-4o': { input: 0.005, output: 0.015 },
    };

    const modelCosts = costs[config.model];
    const total = (promptTokens / 1000) * modelCosts.input + (outputTokens / 1000) * modelCosts.output;

    return {
      estimated: true,
      breakdown: [{ service: 'anthropic', units: promptTokens + outputTokens, unitType: 'tokens', cost: total }],
      total,
      confidence: 'medium',
    };
  }

  // === Execution ===

  async execute(input, config, context, options?): Promise<NodeResult<z.infer<typeof ScriptOutputSchema>>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];

    try {
      // Load archetype (stateless - local variable)
      const archetype = await loadArchetype(input.archetypeId);
      if (!archetype) {
        return {
          success: false,
          error: { code: 'INVALID_ARCHETYPE', message: `Not found: ${input.archetypeId}`, retryable: false },
        };
      }

      // Check cancellation
      if (options?.signal?.aborted) {
        return { success: false, error: { code: 'CANCELLED', message: 'Cancelled', retryable: false } };
      }

      // Resolve duration
      const duration = this.resolveDuration(config, context);
      const { channelBible } = context.config;

      options?.onProgress?.({ percent: 10, message: 'Building prompt...' });

      // Build prompt (implementation detail)
      const prompt = buildScriptPrompt({
        topic: input.topic,
        archetype,
        channelBible,
        research: input.research,
        examples: config.exampleScripts || channelBible.example_scripts,
        duration,
        styleOverrides: config.styleOverrides,
        runInstructions: input.instructions,
        retryContext: context.retry.attemptNumber > 1 ? { lastError: context.retry.lastError } : undefined,
      });

      options?.onProgress?.({ percent: 30, message: 'Generating script...' });

      // Call LLM
      const llmResponse = await this.callLLM(prompt, config, context, apiCalls, options?.signal);

      options?.onProgress?.({ percent: 80, message: 'Parsing output...' });

      // Parse and validate
      const parsed = parseScriptResponse(llmResponse, archetype);
      this.validateArchetypeCompliance(parsed, archetype);

      const completedAt = new Date();
      return {
        success: true,
        output: parsed,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(apiCalls),
          apiCalls,
        },
      };

    } catch (error) {
      return { success: false, error: this.mapError(error) };
    }
  }

  // === Helpers ===

  private resolveDuration(config, context): { min: number; max: number } {
    if (config.targetDuration) return config.targetDuration;
    return parseDurationRange(context.config.channelBible.structure.typical_length);
  }

  private async callLLM(prompt, config, context, apiCalls, signal?) {
    // Implementation calls Anthropic/OpenAI based on config.model
    // Logs to apiCalls array
    // Respects abort signal
  }

  private validateArchetypeCompliance(output, archetype) {
    const requiredSections = archetype.structure.sections.filter(s => s.required);
    const outputSectionIds = new Set(output.sections.map(s => s.archetypeSectionId));
    for (const required of requiredSections) {
      if (!outputSectionIds.has(required.id)) {
        throw new Error(`Missing required section: ${required.name}`);
      }
    }
  }

  private mapError(error: unknown): NodeError {
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        return { code: 'RATE_LIMIT', message: 'Rate limit hit', retryable: true };
      }
      if (error.message.includes('context_length')) {
        return { code: 'CONTEXT_TOO_LONG', message: 'Input too long', retryable: false };
      }
    }
    return { code: 'UNKNOWN', message: String(error), retryable: true };
  }
}
```

### 5.3 Implementation Details (To Be Built)

| Component | Description | Status |
|-----------|-------------|--------|
| `buildScriptPrompt` | Assembles channel bible + archetype + research into prompt | To implement |
| `parseScriptResponse` | Parses LLM JSON output into ScriptOutput | To implement |
| `loadArchetype` | Loads archetype from `docs/archetypes.json` | To implement |
| `estimateTokens` | Estimates token count for cost calculation | To implement |

---

## 6. Database Schema

### 6.1 Core Tables

```sql
-- Runs table: tracks pipeline executions
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES projects NOT NULL,
  pipeline_id TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'running' | 'paused' | 'awaiting_review' | 'completed' | 'failed' | 'cancelled'

  current_node TEXT,
  completed_nodes TEXT[] DEFAULT '{}',
  skipped_nodes TEXT[] DEFAULT '{}',

  -- Full context (JSON for flexibility)
  context JSONB NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Node outputs: individual node results
CREATE TABLE node_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs ON DELETE CASCADE NOT NULL,
  node_id TEXT NOT NULL,

  output JSONB NOT NULL,
  metadata JSONB,  -- ExecutionMetadata

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(run_id, node_id)
);

-- Projects: user's channels/projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,

  -- Resolved config stored as JSON
  config JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credentials (encrypted)
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  credential_type TEXT NOT NULL,  -- 'elevenlabs', 'youtube', etc.
  encrypted_value TEXT NOT NULL,  -- Encrypted via Supabase Vault

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, credential_type)
);

-- Indexes
CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_runs_project_id ON runs(project_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_node_outputs_run_id ON node_outputs(run_id);
```

### 6.2 State Persistence Functions

```typescript
// lib/orchestrator/state.ts

export async function persistRunState(
  runId: string,
  state: { context: RunContext; pipeline: PipelineDefinition }
): Promise<void> {
  const supabase = createServerClient();

  await supabase
    .from('runs')
    .upsert({
      id: runId,
      user_id: state.context.userId,
      project_id: state.context.projectId,
      pipeline_id: state.pipeline.id,
      status: state.context.status,
      current_node: state.context.currentNode,
      completed_nodes: state.context.completedNodes,
      skipped_nodes: state.context.skippedNodes,
      context: state.context,
      updated_at: new Date().toISOString(),
    });
}

export async function loadRunState(runId: string): Promise<{
  context: RunContext;
  pipeline: PipelineDefinition;
} | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error || !data) return null;

  // Reconstruct pipeline from stored pipeline_id
  const pipeline = await loadPipelineDefinition(data.pipeline_id);

  return {
    context: data.context as RunContext,
    pipeline,
  };
}
```

---

## 7. API Endpoints

### 7.1 Run Management

```typescript
// app/api/runs/route.ts

// POST /api/runs - Start new run
export async function POST(request: Request) {
  const { pipelineId, projectId, runOverrides } = await request.json();

  // Load config sources
  const configSources = await loadConfigSources(projectId, runOverrides);

  // Create orchestrator
  const orchestrator = new PipelineOrchestrator(
    await loadPipelineDefinition(pipelineId),
    configSources,
    userId,
    projectId
  );

  // Start execution (non-blocking for long runs)
  orchestrator.run().catch(console.error);

  return Response.json({
    runId: orchestrator.runId,
    status: 'running'
  });
}

// GET /api/runs/:id - Get run status
export async function GET(request: Request, { params }) {
  const run = await loadRunState(params.id);
  if (!run) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({
    runId: params.id,
    status: run.context.status,
    currentNode: run.context.currentNode,
    completedNodes: run.context.completedNodes,
    outputs: run.context.previousOutputs,
  });
}
```

### 7.2 Intervention Handling

```typescript
// app/api/runs/[id]/intervene/route.ts

// POST /api/runs/:id/intervene - Respond to intervention
export async function POST(request: Request, { params }) {
  const { action, edits, feedback, manualInput } = await request.json();

  const orchestrator = await PipelineOrchestrator.resume(params.id);

  let response: InterventionResponse;
  switch (action) {
    case 'approve':
      response = { action: 'approve' };
      break;
    case 'approve_with_edits':
      response = { action: 'approve_with_edits', edits };
      break;
    case 'regenerate':
      response = { action: 'regenerate' };
      break;
    case 'regenerate_with_feedback':
      response = { action: 'regenerate_with_feedback', feedback };
      break;
    case 'skip':
      response = { action: 'skip', manualInput };
      break;
    case 'cancel':
      response = { action: 'cancel' };
      break;
  }

  await orchestrator.respondToIntervention(response);
  await orchestrator.run();  // Continue execution

  return Response.json({ status: orchestrator.status });
}
```

### 7.3 Resume & Cancel

```typescript
// app/api/runs/[id]/resume/route.ts
export async function POST(request: Request, { params }) {
  const orchestrator = await PipelineOrchestrator.resume(params.id);
  orchestrator.run().catch(console.error);
  return Response.json({ status: 'running' });
}

// app/api/runs/[id]/cancel/route.ts
export async function POST(request: Request, { params }) {
  const orchestrator = await PipelineOrchestrator.resume(params.id);
  // Trigger abort
  orchestrator.respondToIntervention({ action: 'cancel' });
  return Response.json({ status: 'cancelled' });
}
```

---

## 8. UI Integration Points

### 8.1 Real-Time Updates

```typescript
// hooks/useRunProgress.ts

export function useRunProgress(runId: string) {
  const [progress, setProgress] = useState<RunProgressUpdate | null>(null);

  useEffect(() => {
    // Subscribe to Supabase realtime
    const subscription = supabase
      .channel(`run:${runId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'runs',
        filter: `id=eq.${runId}`,
      }, (payload) => {
        setProgress({
          runId,
          status: payload.new.status,
          currentNode: payload.new.current_node,
          completedNodes: payload.new.completed_nodes,
          overallPercent: calculatePercent(payload.new),
        });
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [runId]);

  return progress;
}
```

### 8.2 Intervention Modal

```typescript
// components/InterventionModal.tsx

interface Props {
  runId: string;
  nodeId: string;
  output: unknown;
  onClose: () => void;
}

export function InterventionModal({ runId, nodeId, output, onClose }: Props) {
  const [action, setAction] = useState<string>('approve');
  const [feedback, setFeedback] = useState('');
  const [edits, setEdits] = useState(output);

  const handleSubmit = async () => {
    await fetch(`/api/runs/${runId}/intervene`, {
      method: 'POST',
      body: JSON.stringify({ action, feedback, edits }),
    });
    onClose();
  };

  return (
    <Dialog>
      <DialogTitle>Review: {nodeId}</DialogTitle>

      {/* Output preview */}
      <NodeOutputPreview nodeId={nodeId} output={output} onEdit={setEdits} />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={() => { setAction('approve'); handleSubmit(); }}>
          Approve
        </Button>
        <Button onClick={() => { setAction('regenerate'); handleSubmit(); }}>
          Regenerate
        </Button>
        <Button variant="outline" onClick={() => setAction('regenerate_with_feedback')}>
          Regenerate with Feedback
        </Button>
        <Button variant="ghost" onClick={() => { setAction('skip'); handleSubmit(); }}>
          Skip
        </Button>
      </div>

      {action === 'regenerate_with_feedback' && (
        <Textarea
          placeholder="What should be different?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      )}
    </Dialog>
  );
}
```

### 8.3 Node Output Previews

Each node type needs a preview component:

| Node | Preview Component | Features |
|------|-------------------|----------|
| Script | `ScriptPreview` | Collapsible sections, word count, duration estimate |
| Voice | `AudioPreview` | Waveform, playback, segment list |
| Thumbnail | `ThumbnailPreview` | Image grid, CTR scores, selection |
| Assembly | `VideoPreview` | Video player, timeline |
| Publish | `MetadataPreview` | Title, description, tags editor |

---

## 9. Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] **Node Base**
  - [ ] `lib/nodes/base.ts` — Types and interfaces
  - [ ] `lib/nodes/registry.ts` — Node registration
  - [ ] `lib/nodes/context.ts` — RunContext type

- [ ] **Config Resolution**
  - [ ] `lib/config/resolve.ts` — Cascade merge logic
  - [ ] `lib/config/defaults.ts` — System defaults
  - [ ] `lib/config/validate.ts` — Post-merge validation

- [ ] **Orchestrator**
  - [ ] `lib/orchestrator/index.ts` — Main orchestrator
  - [ ] `lib/orchestrator/state.ts` — Persistence functions

- [ ] **Database**
  - [ ] `supabase/migrations/001_runs.sql` — Core tables
  - [ ] `lib/db/server.ts` — Server client
  - [ ] `lib/db/client.ts` — Browser client

### Phase 2: Script Node (Reference)

- [ ] **Types**
  - [ ] `lib/nodes/script/types.ts` — Zod schemas

- [ ] **Implementation**
  - [ ] `lib/nodes/script/index.ts` — Node class
  - [ ] `lib/nodes/script/prompts.ts` — Prompt building
  - [ ] `lib/nodes/script/parser.ts` — Response parsing

- [ ] **Supporting**
  - [ ] `docs/archetypes.json` — Archetype templates
  - [ ] `lib/archetypes/index.ts` — Archetype loader

### Phase 3: API Layer

- [ ] `app/api/runs/route.ts` — Create run
- [ ] `app/api/runs/[id]/route.ts` — Get run status
- [ ] `app/api/runs/[id]/intervene/route.ts` — Handle intervention
- [ ] `app/api/runs/[id]/resume/route.ts` — Resume paused run
- [ ] `app/api/runs/[id]/cancel/route.ts` — Cancel run

### Phase 4: Other Nodes

- [ ] **Voice Node**
  - [ ] `lib/nodes/voice/index.ts`
  - [ ] ElevenLabs integration
  - [ ] Segment-by-segment generation

- [ ] **Thumbnail Node**
  - [ ] `lib/nodes/thumbnail/index.ts`
  - [ ] Gemini integration
  - [ ] Template rendering

- [ ] **Assembly Node**
  - [ ] `lib/nodes/assembly/index.ts`
  - [ ] FFmpeg integration
  - [ ] Caption generation

- [ ] **Publish Node**
  - [ ] `lib/nodes/publish/index.ts`
  - [ ] YouTube API integration
  - [ ] Scheduling logic

### Phase 5: UI

- [ ] Run dashboard
- [ ] Progress tracking (realtime)
- [ ] Intervention modals
- [ ] Node output previews
- [ ] Project configuration

---

## Appendix A: Channel Bible Schema

```typescript
interface ChannelBible {
  channel_name: string;
  tagline?: string;

  target_audience: {
    demographics: string;
    knowledge_level: string;
    why_they_watch: string;
  };

  tone: {
    overall: string;
    humor: string;
    formality: string;
  };

  vocabulary: {
    use_jargon: boolean;
    explain_threshold: string;
    banned_words: string[];
    preferred_phrases: string[];
  };

  structure: {
    typical_length: string;
    hook_style: string;
    cta_style: string;
    intro_length: string;
  };

  rules: {
    always_include: string[];
    never_include: string[];
    fact_check: string;
  };

  example_scripts?: {
    name: string;
    script: string;
    notes: string;
  }[];
}
```

---

## Appendix B: Resolved Config Schema

```typescript
interface ResolvedConfig {
  channelBible: ChannelBible;

  voice: {
    provider: 'elevenlabs' | 'playht' | 'openai';
    voiceId: string;
    speed: number;
    stability?: number;
    pronunciationGuide: { word: string; phonetic: string }[];
  };

  thumbnail: {
    dimensions: { width: number; height: number };
    colors: { primary: string; secondary: string; text: string; accent: string };
    typography: { font_family: string; max_words: number; text_position: string };
    style: { background_type: string; include_face: boolean; overall_mood: string };
    elements: { use_arrows: boolean; use_circles: boolean; use_icons: boolean };
  };

  assembly: {
    resolution: '1080p' | '4k';
    aspect_ratio: '16:9' | '9:16' | '1:1';
    frame_rate: 30 | 60;
    assets: { intro_video?: string; outro_video?: string; background_music?: string };
    style: {
      transition_type: 'cut' | 'fade' | 'swipe';
      text_animation: 'none' | 'fade' | 'typewriter';
      caption_style: { enabled: boolean; font: string; position: string; style: string };
    };
    b_roll: { source: 'generated' | 'stock' | 'manual' };
  };

  publish: {
    platform: 'youtube';
    channel_id: string;
    defaults: { visibility: string; category: string; language: string; made_for_kids: boolean };
    scheduling: { mode: 'immediate' | 'scheduled' | 'draft'; preferred_times?: string[] };
    metadata_template: { description_template: string; default_tags: string[] };
  };

  intervention: InterventionConfig;

  archetype?: Archetype;
}
```

---

## Appendix C: Pipeline Definitions (V1 Hardcoded)

For V1, pipeline definitions are hardcoded. Custom user pipelines can be added in a future version.

```typescript
// lib/pipelines/definitions.ts

export const PIPELINE_DEFINITIONS: Record<string, PipelineDefinition> = {
  'full-video': {
    id: 'full-video',
    name: 'Full Video Production',
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
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'research', id: 'research', dependsOn: ['trigger'] },
      { nodeId: 'script', id: 'script', dependsOn: ['research'] },
    ],
  },

  'script-to-voice': {
    id: 'script-to-voice',
    name: 'Script + Voice',
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
    nodes: [
      { nodeId: 'trigger', id: 'trigger' },
      { nodeId: 'thumbnail', id: 'thumbnail', dependsOn: ['trigger'] },
    ],
  },

  'assemble-and-publish': {
    id: 'assemble-and-publish',
    name: 'Assemble & Publish (Manual Inputs)',
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

// Future: Load from database for custom user pipelines
// export async function loadPipelineDefinition(pipelineId: string): Promise<PipelineDefinition> {
//   // Check hardcoded first
//   if (PIPELINE_DEFINITIONS[pipelineId]) {
//     return PIPELINE_DEFINITIONS[pipelineId];
//   }
//   // Then check database
//   const supabase = createServerClient();
//   const { data } = await supabase.from('pipelines').select('*').eq('id', pipelineId).single();
//   return data as PipelineDefinition;
// }
```

---

## Appendix D: Credential Manager

User API keys are stored encrypted using Supabase Vault.

```typescript
// lib/credentials/manager.ts

import { createServerClient } from '@/lib/db/server';

export class CredentialManager {
  private userId: string;
  private cache: Map<CredentialType, string> = new Map();

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get decrypted credential value.
   * Caches in memory for duration of request.
   */
  async get(type: CredentialType): Promise<string> {
    // Check cache first
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    const supabase = createServerClient();

    // Fetch and decrypt via Supabase Vault
    const { data, error } = await supabase
      .rpc('get_decrypted_credential', {
        p_user_id: this.userId,
        p_credential_type: type,
      });

    if (error || !data) {
      throw new CredentialNotFoundError(type);
    }

    this.cache.set(type, data);
    return data;
  }

  /**
   * Store encrypted credential.
   */
  async set(type: CredentialType, value: string): Promise<void> {
    const supabase = createServerClient();

    // Encrypt and store via Supabase Vault
    const { error } = await supabase
      .rpc('set_encrypted_credential', {
        p_user_id: this.userId,
        p_credential_type: type,
        p_value: value,
      });

    if (error) {
      throw new CredentialStorageError(type, error.message);
    }

    // Update cache
    this.cache.set(type, value);
  }

  /**
   * Check if credential exists without decrypting.
   */
  async has(type: CredentialType): Promise<boolean> {
    const supabase = createServerClient();

    const { count } = await supabase
      .from('user_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('credential_type', type);

    return (count ?? 0) > 0;
  }

  /**
   * Delete credential.
   */
  async delete(type: CredentialType): Promise<void> {
    const supabase = createServerClient();

    await supabase
      .from('user_credentials')
      .delete()
      .eq('user_id', this.userId)
      .eq('credential_type', type);

    this.cache.delete(type);
  }
}

// === Errors ===

export class CredentialNotFoundError extends Error {
  constructor(public type: CredentialType) {
    super(`Credential not found: ${type}`);
    this.name = 'CredentialNotFoundError';
  }
}

export class CredentialStorageError extends Error {
  constructor(public type: CredentialType, message: string) {
    super(`Failed to store credential ${type}: ${message}`);
    this.name = 'CredentialStorageError';
  }
}
```

### Supabase Vault Functions

```sql
-- Function to store encrypted credential
CREATE OR REPLACE FUNCTION set_encrypted_credential(
  p_user_id UUID,
  p_credential_type TEXT,
  p_value TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_credentials (user_id, credential_type, encrypted_value)
  VALUES (
    p_user_id,
    p_credential_type,
    vault.encrypt(p_value::bytea)
  )
  ON CONFLICT (user_id, credential_type)
  DO UPDATE SET
    encrypted_value = vault.encrypt(p_value::bytea),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get decrypted credential
CREATE OR REPLACE FUNCTION get_decrypted_credential(
  p_user_id UUID,
  p_credential_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_encrypted BYTEA;
BEGIN
  SELECT encrypted_value INTO v_encrypted
  FROM user_credentials
  WHERE user_id = p_user_id AND credential_type = p_credential_type;

  IF v_encrypted IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN convert_from(vault.decrypt(v_encrypted), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

*Document Version: 1.0*
*Status: Ready for implementation*
