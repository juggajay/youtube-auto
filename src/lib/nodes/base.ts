import { z, type ZodTypeAny } from 'zod';

// === Credential Types ===

export type CredentialType =
  | 'elevenlabs'
  | 'playht'
  | 'openai'
  | 'youtube'
  | 'anthropic'
  | 'gemini'
  | 'pexels'
  | 'storyblocks';

// === Node Categories ===

export type NodeCategory = 'trigger' | 'content' | 'production' | 'publish';

// === Node Metadata ===

export interface NodeMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: NodeCategory;
  requiredCredentials: CredentialType[];
  estimatedDuration: string;
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
    unitType: string;
    cost: number;
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
  percent: number;
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
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// === Type Guards ===

export function isSuccessResult<T>(result: NodeResult<T>): result is { success: true; output: T; metadata: ExecutionMetadata } {
  return result.success === true;
}

export function isFailureResult<T>(result: NodeResult<T>): result is { success: false; error: NodeError; partialOutput?: Partial<T> } {
  return result.success === false;
}

// === Node Contract Interface ===

export interface NodeContract<
  TInput extends ZodTypeAny,
  TOutput extends ZodTypeAny,
  TConfig extends ZodTypeAny
> {
  meta: NodeMeta;

  inputSchema: TInput;
  outputSchema: TOutput;
  configSchema: TConfig;

  validate(
    input: z.infer<TInput>,
    config: z.infer<TConfig>,
    context: RunContext
  ): ValidationResult;

  estimateCost(
    input: z.infer<TInput>,
    config: z.infer<TConfig>
  ): CostEstimate;

  execute(
    input: z.infer<TInput>,
    config: z.infer<TConfig>,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<z.infer<TOutput>>>;

  getInputFromContext?(context: RunContext): z.infer<TInput>;

  beforeExecute?(
    input: z.infer<TInput>,
    config: z.infer<TConfig>,
    context: RunContext
  ): Promise<{ input: z.infer<TInput>; config: z.infer<TConfig> }>;

  afterExecute?(
    output: z.infer<TOutput>,
    context: RunContext
  ): Promise<z.infer<TOutput>>;
}

// Forward declaration - will be implemented in context.ts
export interface RunContext {
  runId: string;
  projectId: string;
  userId: string;
  status: RunStatus;
  // ... rest defined in context.ts
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'awaiting_review'
  | 'completed'
  | 'failed'
  | 'cancelled';
