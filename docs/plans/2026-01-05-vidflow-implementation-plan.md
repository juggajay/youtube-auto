# VidFlow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core VidFlow pipeline infrastructure — node contracts, config resolution, orchestrator, and a working script node — sufficient to run a complete script-only pipeline.

**Architecture:** Modular node-based system where each node implements a common contract. The orchestrator executes nodes in dependency order, handles interventions, and persists state. Configuration cascades from system → user → project → template → run.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Supabase (PostgreSQL + Auth), Zod validation, Zustand state management.

**Reference:** See `docs/plans/2026-01-05-node-architecture-design.md` for full architecture specification.

---

## Phase 1: Project Setup

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `.env.local.example`

**Step 1: Create Next.js app**

```bash
cd C:\Users\jayso\youtube-auto
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Select options:
- Would you like to use TypeScript? Yes
- Would you like to use ESLint? Yes
- Would you like to use Tailwind CSS? Yes
- Would you like to use `src/` directory? Yes
- Would you like to use App Router? Yes
- Would you like to customize the default import alias? Yes (@/*)

**Step 2: Install core dependencies**

```bash
pnpm add zod zustand @supabase/supabase-js @supabase/ssr uuid
pnpm add -D @types/uuid supabase
```

**Step 3: Create environment template**

Create `.env.local.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI APIs (server-side only)
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_gemini_key
```

**Step 4: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 1.2: Set Up Project Structure

**Files:**
- Create: `src/lib/nodes/.gitkeep`
- Create: `src/lib/config/.gitkeep`
- Create: `src/lib/orchestrator/.gitkeep`
- Create: `src/lib/db/.gitkeep`
- Create: `src/lib/credentials/.gitkeep`
- Create: `src/types/index.ts`

**Step 1: Create directory structure**

```bash
mkdir -p src/lib/nodes src/lib/config src/lib/orchestrator src/lib/db src/lib/credentials src/lib/pipelines src/lib/archetypes
mkdir -p src/types
mkdir -p src/app/api/runs
mkdir -p src/components/nodes src/components/workflow src/components/ui
```

**Step 2: Create types barrel file**

Create `src/types/index.ts`:
```typescript
// Re-export all types from this barrel file
export * from './config';
export * from './nodes';
```

**Step 3: Create placeholder type files**

Create `src/types/config.ts`:
```typescript
// Configuration types - to be implemented
export interface PlaceholderConfig {}
```

Create `src/types/nodes.ts`:
```typescript
// Node types - to be implemented
export interface PlaceholderNode {}
```

**Step 4: Commit**

```bash
git add .
git commit -m "chore: set up project directory structure"
```

---

## Phase 2: Core Types & Node Contract

### Task 2.1: Implement Base Node Types

**Files:**
- Create: `src/lib/nodes/base.ts`
- Test: `src/lib/nodes/__tests__/base.test.ts`

**Step 1: Create test file first**

Create `src/lib/nodes/__tests__/base.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  type CredentialType,
  type NodeCategory,
  type NodeMeta,
  type ValidationResult,
  type CostEstimate,
  type NodeResult,
  type NodeError,
  isSuccessResult,
  isFailureResult,
} from '../base';

describe('Node Base Types', () => {
  describe('NodeResult type guards', () => {
    it('isSuccessResult returns true for success result', () => {
      const result: NodeResult<string> = {
        success: true,
        output: 'test',
        metadata: {
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 100,
          actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
          apiCalls: [],
        },
      };
      expect(isSuccessResult(result)).toBe(true);
      expect(isFailureResult(result)).toBe(false);
    });

    it('isFailureResult returns true for failure result', () => {
      const result: NodeResult<string> = {
        success: false,
        error: { code: 'TEST_ERROR', message: 'Test', retryable: false },
      };
      expect(isFailureResult(result)).toBe(true);
      expect(isSuccessResult(result)).toBe(false);
    });
  });

  describe('ValidationResult', () => {
    it('can represent valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };
      expect(result.valid).toBe(true);
    });

    it('can represent invalid result with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [{ field: 'topic', message: 'Topic is required' }],
        warnings: [],
      };
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});
```

**Step 2: Install and configure Vitest**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

**Step 3: Run test to verify it fails**

```bash
pnpm test:run src/lib/nodes/__tests__/base.test.ts
```

Expected: FAIL - module not found

**Step 4: Implement base types**

Create `src/lib/nodes/base.ts`:
```typescript
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
```

**Step 5: Run test to verify it passes**

```bash
pnpm test:run src/lib/nodes/__tests__/base.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add .
git commit -m "feat: implement base node types and contract interface"
```

---

### Task 2.2: Implement Run Context Types

**Files:**
- Create: `src/lib/nodes/context.ts`
- Test: `src/lib/nodes/__tests__/context.test.ts`

**Step 1: Write test**

Create `src/lib/nodes/__tests__/context.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createInitialRunContext, type RunContext } from '../context';

describe('RunContext', () => {
  it('creates initial context with required fields', () => {
    const context = createInitialRunContext({
      userId: 'user-123',
      projectId: 'project-456',
    });

    expect(context.runId).toBeDefined();
    expect(context.userId).toBe('user-123');
    expect(context.projectId).toBe('project-456');
    expect(context.status).toBe('pending');
    expect(context.completedNodes).toEqual([]);
    expect(context.skippedNodes).toEqual([]);
    expect(context.previousOutputs).toEqual({});
  });

  it('initializes retry state correctly', () => {
    const context = createInitialRunContext({
      userId: 'user-123',
      projectId: 'project-456',
    });

    expect(context.retry.attemptNumber).toBe(1);
    expect(context.retry.maxAttempts).toBe(3);
    expect(context.retry.lastError).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test:run src/lib/nodes/__tests__/context.test.ts
```

Expected: FAIL

**Step 3: Implement context**

Create `src/lib/nodes/context.ts`:
```typescript
import { v4 as uuidv4 } from 'uuid';
import type { NodeError, RunStatus } from './base';
import type { ResolvedConfig } from '@/lib/config/types';

// === Node Output Types ===

export interface TriggerOutput {
  topic: string;
  archetypeId: string;
  sourceType: 'manual' | 'scheduled' | 'webhook' | 'nicheradar';
  sourceData?: Record<string, unknown>;
}

export interface ResearchOutput {
  summary: string;
  keyPoints: string[];
  sources: { title: string; url: string; snippet: string }[];
  comparisons?: Record<string, unknown>;
  recentDevelopments?: string[];
}

export interface ScriptOutput {
  title: string;
  hook: {
    text: string;
    durationEstimate: number;
    visualNotes: string;
  };
  sections: {
    id: string;
    name: string;
    archetypeSectionId?: string;
    script: string;
    durationEstimate: number;
    visualNotes: string;
    bRollSuggestions: string[];
  }[];
  outro: {
    text: string;
    cta: string;
  };
  metadata: {
    descriptionDraft: string;
    tags: string[];
    chapters: { timestamp: string; title: string }[];
  };
  totalDurationEstimate: number;
  wordCount: number;
}

export interface VoiceOutput {
  segments: {
    id: string;
    file: string;
    duration: number;
    text: string;
  }[];
  totalDuration: number;
}

export interface ThumbnailOutput {
  selected: string;
  options: {
    file: string;
    ctrScore?: number;
  }[];
}

export interface AssemblyOutput {
  videoFile: string;
  subtitleFile?: string;
  duration: number;
  resolution: string;
}

// === Run Context ===

export interface RunContext {
  // Identifiers
  runId: string;
  projectId: string;
  userId: string;

  // Run State
  status: RunStatus;
  startedAt: Date;
  currentNode: string | null;
  completedNodes: string[];
  skippedNodes: string[];

  // Retry Tracking
  retry: {
    attemptNumber: number;
    maxAttempts: number;
    lastError?: NodeError;
  };

  // Accumulated Outputs
  previousOutputs: {
    trigger?: TriggerOutput;
    research?: ResearchOutput;
    script?: ScriptOutput;
    voice?: VoiceOutput;
    thumbnail?: ThumbnailOutput;
    assembly?: AssemblyOutput;
    [nodeId: string]: unknown;
  };

  // Resolved Configuration
  config: ResolvedConfig;

  // Services (injected at runtime)
  services: RunServices;

  // Run Overrides
  runOverrides: {
    instructions?: string;
    skipNodes?: string[];
    nodeOverrides?: Record<string, unknown>;
  };
}

export interface RunServices {
  db: DatabaseClient;
  storage: StorageClient;
  credentials: CredentialManager;
  logger: Logger;
}

// Placeholder interfaces - will be implemented later
export interface DatabaseClient {
  // To be implemented
}

export interface StorageClient {
  // To be implemented
}

export interface CredentialManager {
  get(type: string): Promise<string>;
  set(type: string, value: string): Promise<void>;
  has(type: string): Promise<boolean>;
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  log(level: string, message: string, data?: Record<string, unknown>): void;
}

// === Factory Function ===

export interface CreateContextParams {
  userId: string;
  projectId: string;
  config?: ResolvedConfig;
  services?: Partial<RunServices>;
  runOverrides?: RunContext['runOverrides'];
}

export function createInitialRunContext(params: CreateContextParams): RunContext {
  const defaultConfig: ResolvedConfig = {
    channelBible: {
      channel_name: '',
      target_audience: { demographics: '', knowledge_level: '', why_they_watch: '' },
      tone: { overall: 'professional', humor: 'none', formality: 'neutral' },
      vocabulary: { use_jargon: false, explain_threshold: '', banned_words: [], preferred_phrases: [] },
      structure: { typical_length: '8-12 minutes', hook_style: '', cta_style: '', intro_length: '' },
      rules: { always_include: [], never_include: [], fact_check: '' },
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: '',
      speed: 1.0,
      stability: 0.75,
      pronunciationGuide: [],
    },
    thumbnail: {
      dimensions: { width: 1280, height: 720 },
      colors: { primary: '#2563EB', secondary: '#1E293B', text: '#FFFFFF', accent: '#F59E0B' },
      typography: { font_family: 'Inter', max_words: 4, text_position: 'dynamic' },
      style: { background_type: 'generated', include_face: false, overall_mood: 'professional' },
      elements: { use_arrows: false, use_circles: false, use_icons: true },
    },
    assembly: {
      resolution: '1080p',
      aspect_ratio: '16:9',
      frame_rate: 30,
      assets: {},
      style: {
        transition_type: 'cut',
        text_animation: 'fade',
        caption_style: { enabled: true, font: 'Inter', position: 'bottom', style: 'standard' },
      },
      b_roll: { source: 'generated' },
    },
    publish: {
      platform: 'youtube',
      channel_id: '',
      defaults: { visibility: 'private', category: '22', language: 'en', made_for_kids: false },
      scheduling: { mode: 'draft' },
      metadata_template: { description_template: '', default_tags: [] },
    },
    intervention: {
      nodes: {
        trigger: 'auto',
        research: 'auto',
        script: 'review',
        voice: 'auto',
        thumbnail: 'review',
        assembly: 'auto',
        publish: 'always_review',
      },
      defaults: { pauseOnError: true, notifyOnComplete: true },
    },
  };

  const defaultLogger: Logger = {
    debug: (msg, data) => console.debug(`[DEBUG] ${msg}`, data),
    info: (msg, data) => console.info(`[INFO] ${msg}`, data),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data),
    log: (level, msg, data) => console.log(`[${level.toUpperCase()}] ${msg}`, data),
  };

  return {
    runId: uuidv4(),
    projectId: params.projectId,
    userId: params.userId,
    status: 'pending',
    startedAt: new Date(),
    currentNode: null,
    completedNodes: [],
    skippedNodes: [],
    retry: {
      attemptNumber: 1,
      maxAttempts: 3,
      lastError: undefined,
    },
    previousOutputs: {},
    config: params.config ?? defaultConfig,
    services: {
      db: params.services?.db ?? ({} as DatabaseClient),
      storage: params.services?.storage ?? ({} as StorageClient),
      credentials: params.services?.credentials ?? ({
        get: async () => '',
        set: async () => {},
        has: async () => false,
      } as CredentialManager),
      logger: params.services?.logger ?? defaultLogger,
    },
    runOverrides: params.runOverrides ?? {},
  };
}

// Re-export RunStatus from base
export type { RunStatus } from './base';
```

**Step 4: Create config types placeholder**

Create `src/lib/config/types.ts`:
```typescript
// === Channel Bible ===

export interface ChannelBible {
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

// === Intervention ===

export type InterventionLevel = 'auto' | 'review' | 'always_review';

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

// === Resolved Config ===

export interface ResolvedConfig {
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

// === Archetype ===

export interface Archetype {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: {
      id: string;
      name: string;
      required: boolean;
      description: string;
    }[];
  };
  titleFormula?: string;
  hookTemplate?: string;
}
```

**Step 5: Run test to verify it passes**

```bash
pnpm test:run src/lib/nodes/__tests__/context.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add .
git commit -m "feat: implement RunContext types and factory function"
```

---

## Phase 3: Config Resolution

### Task 3.1: Implement Deep Merge Utility

**Files:**
- Create: `src/lib/config/merge.ts`
- Test: `src/lib/config/__tests__/merge.test.ts`

**Step 1: Write test**

Create `src/lib/config/__tests__/merge.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { deepMerge } from '../merge';

describe('deepMerge', () => {
  it('merges primitive values (later wins)', () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3 };
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('replaces arrays entirely (no concat)', () => {
    const base = { items: [1, 2, 3] };
    const override = { items: [4, 5] };
    const result = deepMerge(base, override);
    expect(result.items).toEqual([4, 5]);
  });

  it('recursively merges nested objects', () => {
    const base = { nested: { a: 1, b: 2 } };
    const override = { nested: { b: 3, c: 4 } };
    const result = deepMerge(base, override);
    expect(result.nested).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('keeps base value when override is null', () => {
    const base = { a: 'keep' };
    const override = { a: null };
    const result = deepMerge(base, override as any);
    expect(result.a).toBe('keep');
  });

  it('keeps base value when override is undefined', () => {
    const base = { a: 'keep' };
    const override = { a: undefined };
    const result = deepMerge(base, override as any);
    expect(result.a).toBe('keep');
  });

  it('handles deeply nested structures', () => {
    const base = {
      level1: {
        level2: {
          level3: { value: 'base' },
        },
      },
    };
    const override = {
      level1: {
        level2: {
          level3: { value: 'override' },
        },
      },
    };
    const result = deepMerge(base, override);
    expect(result.level1.level2.level3.value).toBe('override');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test:run src/lib/config/__tests__/merge.test.ts
```

Expected: FAIL

**Step 3: Implement deepMerge**

Create `src/lib/config/merge.ts`:
```typescript
/**
 * Deep merge with explicit rules:
 * - Primitives: later wins
 * - Arrays: later replaces entirely (no concat)
 * - Objects: recurse and merge
 * - null/undefined in later: keeps earlier value (no accidental wipes)
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    const baseValue = base[key];

    // Skip null/undefined - keeps base value
    if (overrideValue === null || overrideValue === undefined) {
      continue;
    }

    // Arrays: replace entirely
    if (Array.isArray(overrideValue)) {
      result[key] = overrideValue as T[keyof T];
      continue;
    }

    // Objects: recurse
    if (
      typeof overrideValue === 'object' &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[keyof T];
      continue;
    }

    // Primitives: override wins
    result[key] = overrideValue as T[keyof T];
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test:run src/lib/config/__tests__/merge.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: implement deepMerge utility for config cascade"
```

---

### Task 3.2: Implement Config Resolution

**Files:**
- Create: `src/lib/config/resolve.ts`
- Create: `src/lib/config/defaults.ts`
- Test: `src/lib/config/__tests__/resolve.test.ts`

**Step 1: Write test**

Create `src/lib/config/__tests__/resolve.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { resolveConfig, ConfigResolutionError } from '../resolve';
import type { ConfigSource } from '../resolve';

describe('resolveConfig', () => {
  it('returns system defaults when no sources provided', () => {
    const result = resolveConfig([]);
    expect(result.voice.speed).toBe(1.0);
    expect(result.intervention.nodes.publish).toBe('always_review');
  });

  it('merges sources in level order', () => {
    const sources: ConfigSource[] = [
      { level: 'project', config: { voice: { speed: 1.2 } } },
      { level: 'user', config: { voice: { speed: 1.1 } } },
    ];
    const result = resolveConfig(sources);
    // Project overrides user
    expect(result.voice.speed).toBe(1.2);
  });

  it('run level overrides all others', () => {
    const sources: ConfigSource[] = [
      { level: 'system', config: { voice: { speed: 1.0 } } },
      { level: 'user', config: { voice: { speed: 1.1 } } },
      { level: 'project', config: { voice: { speed: 1.2 } } },
      { level: 'run', config: { voice: { speed: 1.5 } } },
    ];
    const result = resolveConfig(sources);
    expect(result.voice.speed).toBe(1.5);
  });

  it('validates required fields after merge', () => {
    const sources: ConfigSource[] = [
      {
        level: 'project',
        config: {
          voice: { provider: 'elevenlabs', voiceId: '' },
          publish: { platform: 'youtube', channel_id: '' },
        }
      },
    ];

    // Should throw because voiceId and channel_id are empty
    expect(() => resolveConfig(sources)).toThrow(ConfigResolutionError);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test:run src/lib/config/__tests__/resolve.test.ts
```

Expected: FAIL

**Step 3: Implement defaults**

Create `src/lib/config/defaults.ts`:
```typescript
import type { ResolvedConfig } from './types';

export function getSystemDefaults(): ResolvedConfig {
  return {
    channelBible: {
      channel_name: '',
      target_audience: { demographics: '', knowledge_level: '', why_they_watch: '' },
      tone: { overall: 'professional', humor: 'none', formality: 'neutral' },
      vocabulary: { use_jargon: false, explain_threshold: '', banned_words: [], preferred_phrases: [] },
      structure: { typical_length: '8-12 minutes', hook_style: '', cta_style: '', intro_length: '' },
      rules: { always_include: [], never_include: [], fact_check: '' },
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: '',
      speed: 1.0,
      stability: 0.75,
      pronunciationGuide: [],
    },
    thumbnail: {
      dimensions: { width: 1280, height: 720 },
      colors: { primary: '#2563EB', secondary: '#1E293B', text: '#FFFFFF', accent: '#F59E0B' },
      typography: { font_family: 'Inter', max_words: 4, text_position: 'dynamic' },
      style: { background_type: 'generated', include_face: false, overall_mood: 'professional' },
      elements: { use_arrows: false, use_circles: false, use_icons: true },
    },
    assembly: {
      resolution: '1080p',
      aspect_ratio: '16:9',
      frame_rate: 30,
      assets: {},
      style: {
        transition_type: 'cut',
        text_animation: 'fade',
        caption_style: { enabled: true, font: 'Inter', position: 'bottom', style: 'standard' },
      },
      b_roll: { source: 'generated' },
    },
    publish: {
      platform: 'youtube',
      channel_id: '',
      defaults: { visibility: 'private', category: '22', language: 'en', made_for_kids: false },
      scheduling: { mode: 'draft' },
      metadata_template: { description_template: '', default_tags: [] },
    },
    intervention: {
      nodes: {
        trigger: 'auto',
        research: 'auto',
        script: 'review',
        voice: 'auto',
        thumbnail: 'review',
        assembly: 'auto',
        publish: 'always_review',
      },
      defaults: { pauseOnError: true, notifyOnComplete: true },
    },
  };
}
```

**Step 4: Implement resolver**

Create `src/lib/config/resolve.ts`:
```typescript
import { deepMerge } from './merge';
import { getSystemDefaults } from './defaults';
import type { ResolvedConfig } from './types';
import type { ValidationResult } from '@/lib/nodes/base';

export type ConfigLevel = 'system' | 'user' | 'project' | 'template' | 'run';

export interface ConfigSource {
  level: ConfigLevel;
  config: Partial<ResolvedConfig>;
}

const LEVEL_ORDER: ConfigLevel[] = ['system', 'user', 'project', 'template', 'run'];

export function resolveConfig(sources: ConfigSource[]): ResolvedConfig {
  const sorted = [...sources].sort((a, b) =>
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

  // Voice: require voiceId if provider set
  if (config.voice.provider && !config.voice.voiceId) {
    errors.push({
      field: 'voice.voiceId',
      message: 'Voice ID required when provider is set'
    });
  }

  // Publish: require channel_id for YouTube
  if (config.publish.platform === 'youtube' && !config.publish.channel_id) {
    errors.push({
      field: 'publish.channel_id',
      message: 'YouTube channel ID required for publishing'
    });
  }

  // Warnings for missing optional fields
  if (!config.channelBible.channel_name) {
    warnings.push({
      field: 'channelBible.channel_name',
      message: 'Channel name not set'
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export class ConfigResolutionError extends Error {
  constructor(public errors: { field: string; message: string }[]) {
    super(`Config resolution failed: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'ConfigResolutionError';
  }
}
```

**Step 5: Update test to handle validation properly**

Since the test expects validation to throw, we need to provide valid config or skip validation:

Update `src/lib/config/__tests__/resolve.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { resolveConfig, ConfigResolutionError } from '../resolve';
import type { ConfigSource } from '../resolve';

describe('resolveConfig', () => {
  // Helper to create valid config sources
  const validProjectConfig: ConfigSource = {
    level: 'project',
    config: {
      voice: { voiceId: 'valid-voice-id' },
      publish: { channel_id: 'valid-channel-id' },
    },
  };

  it('returns system defaults when only valid overrides provided', () => {
    const result = resolveConfig([validProjectConfig]);
    expect(result.voice.speed).toBe(1.0);
    expect(result.intervention.nodes.publish).toBe('always_review');
  });

  it('merges sources in level order', () => {
    const sources: ConfigSource[] = [
      { level: 'project', config: { voice: { speed: 1.2, voiceId: 'test' }, publish: { channel_id: 'test' } } },
      { level: 'user', config: { voice: { speed: 1.1 } } },
    ];
    const result = resolveConfig(sources);
    expect(result.voice.speed).toBe(1.2);
  });

  it('run level overrides all others', () => {
    const sources: ConfigSource[] = [
      { level: 'system', config: { voice: { speed: 1.0 } } },
      { level: 'user', config: { voice: { speed: 1.1 } } },
      { level: 'project', config: { voice: { speed: 1.2, voiceId: 'test' }, publish: { channel_id: 'test' } } },
      { level: 'run', config: { voice: { speed: 1.5 } } },
    ];
    const result = resolveConfig(sources);
    expect(result.voice.speed).toBe(1.5);
  });

  it('throws ConfigResolutionError when required fields missing', () => {
    const sources: ConfigSource[] = [
      {
        level: 'project',
        config: {
          voice: { provider: 'elevenlabs', voiceId: '' },
        }
      },
    ];

    expect(() => resolveConfig(sources)).toThrow(ConfigResolutionError);
  });
});
```

**Step 6: Run test to verify it passes**

```bash
pnpm test:run src/lib/config/__tests__/resolve.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add .
git commit -m "feat: implement config resolution with cascade merge and validation"
```

---

## Phase 4: Node Registry

### Task 4.1: Implement Node Registry

**Files:**
- Create: `src/lib/nodes/registry.ts`
- Test: `src/lib/nodes/__tests__/registry.test.ts`

**Step 1: Write test**

Create `src/lib/nodes/__tests__/registry.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NodeRegistry, nodeRegistry } from '../registry';
import type { NodeContract } from '../base';
import { z } from 'zod';

// Mock node for testing
const mockNode: NodeContract<any, any, any> = {
  meta: {
    id: 'test-node',
    name: 'Test Node',
    description: 'A test node',
    icon: 'TestIcon',
    category: 'content',
    requiredCredentials: [],
    estimatedDuration: '1s',
  },
  inputSchema: z.object({ value: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  configSchema: z.object({}),
  validate: () => ({ valid: true, errors: [], warnings: [] }),
  estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
  execute: async () => ({
    success: true,
    output: { result: 'test' },
    metadata: {
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
      actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
      apiCalls: [],
    },
  }),
};

describe('NodeRegistry', () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = new NodeRegistry();
  });

  it('registers a node', () => {
    registry.register(mockNode);
    expect(registry.has('test-node')).toBe(true);
  });

  it('retrieves a registered node', () => {
    registry.register(mockNode);
    const node = registry.get('test-node');
    expect(node).toBe(mockNode);
  });

  it('returns undefined for unregistered node', () => {
    const node = registry.get('nonexistent');
    expect(node).toBeUndefined();
  });

  it('lists all registered nodes', () => {
    registry.register(mockNode);
    const nodes = registry.list();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].meta.id).toBe('test-node');
  });

  it('prevents duplicate registration', () => {
    registry.register(mockNode);
    expect(() => registry.register(mockNode)).toThrow('already registered');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test:run src/lib/nodes/__tests__/registry.test.ts
```

Expected: FAIL

**Step 3: Implement registry**

Create `src/lib/nodes/registry.ts`:
```typescript
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
```

**Step 4: Run test to verify it passes**

```bash
pnpm test:run src/lib/nodes/__tests__/registry.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: implement NodeRegistry for node management"
```

---

## Phase 5: Pipeline Definitions

### Task 5.1: Implement Pipeline Definitions

**Files:**
- Create: `src/lib/pipelines/definitions.ts`
- Create: `src/lib/pipelines/types.ts`
- Test: `src/lib/pipelines/__tests__/definitions.test.ts`

**Step 1: Write types**

Create `src/lib/pipelines/types.ts`:
```typescript
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
```

**Step 2: Write test**

Create `src/lib/pipelines/__tests__/definitions.test.ts`:
```typescript
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
```

**Step 3: Run test to verify it fails**

```bash
pnpm test:run src/lib/pipelines/__tests__/definitions.test.ts
```

Expected: FAIL

**Step 4: Implement definitions**

Create `src/lib/pipelines/definitions.ts`:
```typescript
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
```

**Step 5: Run test to verify it passes**

```bash
pnpm test:run src/lib/pipelines/__tests__/definitions.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add .
git commit -m "feat: implement hardcoded pipeline definitions"
```

---

## Phase 6: Orchestrator (Core)

### Task 6.1: Implement Orchestrator Types

**Files:**
- Create: `src/lib/orchestrator/types.ts`

**Step 1: Create types file**

Create `src/lib/orchestrator/types.ts`:
```typescript
import type { NodeResult, RunStatus } from '@/lib/nodes/base';
import type { RunContext } from '@/lib/nodes/context';
import type { PipelineDefinition } from '@/lib/pipelines/types';

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

export interface SavedRunState {
  context: RunContext;
  pipeline: PipelineDefinition;
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add orchestrator types"
```

---

### Task 6.2: Implement Orchestrator Core

**Files:**
- Create: `src/lib/orchestrator/index.ts`
- Test: `src/lib/orchestrator/__tests__/orchestrator.test.ts`

**Step 1: Write test**

Create `src/lib/orchestrator/__tests__/orchestrator.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineOrchestrator } from '../index';
import { nodeRegistry } from '@/lib/nodes/registry';
import type { NodeContract } from '@/lib/nodes/base';
import { z } from 'zod';

// Create a minimal mock trigger node
const createMockTriggerNode = (): NodeContract<any, any, any> => ({
  meta: {
    id: 'trigger',
    name: 'Trigger',
    description: 'Test trigger',
    icon: 'Play',
    category: 'trigger',
    requiredCredentials: [],
    estimatedDuration: '1s',
  },
  inputSchema: z.object({}),
  outputSchema: z.object({ topic: z.string(), archetypeId: z.string() }),
  configSchema: z.object({}),
  validate: () => ({ valid: true, errors: [], warnings: [] }),
  estimateCost: () => ({ estimated: false, breakdown: [], total: 0, confidence: 'low' }),
  execute: async () => ({
    success: true,
    output: { topic: 'Test Topic', archetypeId: 'explainer' },
    metadata: {
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 10,
      actualCost: { estimated: false, breakdown: [], total: 0, confidence: 'low' },
      apiCalls: [],
    },
  }),
  getInputFromContext: () => ({}),
});

describe('PipelineOrchestrator', () => {
  beforeEach(() => {
    // Clear and re-register mock nodes
    const registry = nodeRegistry as any;
    registry.nodes = new Map();
    nodeRegistry.register(createMockTriggerNode());
  });

  it('creates orchestrator with valid params', () => {
    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [],
      'user-123',
      'project-456'
    );

    expect(orchestrator.runId).toBeDefined();
    expect(orchestrator.status).toBe('pending');
  });

  it('executes single-node pipeline successfully', async () => {
    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [{ level: 'project', config: { voice: { voiceId: 'test' }, publish: { channel_id: 'test' } } }],
      'user-123',
      'project-456'
    );

    const result = await orchestrator.run();
    expect(result.status).toBe('completed');
    expect(result.previousOutputs.trigger).toBeDefined();
  });

  it('reports progress during execution', async () => {
    const progressUpdates: any[] = [];

    const orchestrator = new PipelineOrchestrator(
      { id: 'test', name: 'Test', nodes: [{ nodeId: 'trigger', id: 'trigger' }] },
      [{ level: 'project', config: { voice: { voiceId: 'test' }, publish: { channel_id: 'test' } } }],
      'user-123',
      'project-456',
      { onProgress: (update) => progressUpdates.push(update) }
    );

    await orchestrator.run();
    expect(progressUpdates.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test:run src/lib/orchestrator/__tests__/orchestrator.test.ts
```

Expected: FAIL

**Step 3: Implement orchestrator**

Create `src/lib/orchestrator/index.ts`:
```typescript
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { NodeResult, NodeError, RunStatus } from '@/lib/nodes/base';
import { isSuccessResult } from '@/lib/nodes/base';
import { createInitialRunContext, type RunContext } from '@/lib/nodes/context';
import { nodeRegistry } from '@/lib/nodes/registry';
import { resolveConfig, type ConfigSource } from '@/lib/config/resolve';
import type { PipelineDefinition, PipelineNodeConfig } from '@/lib/pipelines/types';
import type { InterventionLevel } from '@/lib/config/types';
import type { RunOptions, RunProgressUpdate, InterventionResponse, SavedRunState } from './types';

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

    this.context = createInitialRunContext({
      userId,
      projectId,
      config: resolvedConfig,
    });
  }

  // === Getters ===

  get runId(): string {
    return this.context.runId;
  }

  get status(): RunStatus {
    return this.context.status;
  }

  get currentOutput(): RunContext['previousOutputs'] {
    return this.context.previousOutputs;
  }

  // === Main Execution ===

  async run(): Promise<RunContext> {
    this.context.status = 'running';
    this.emitProgress();

    try {
      const executionOrder = this.resolveExecutionOrder();

      for (const nodeConfig of executionOrder) {
        if (this.options.signal?.aborted) {
          this.context.status = 'cancelled';
          break;
        }

        if (this.context.completedNodes.includes(nodeConfig.id)) {
          continue;
        }

        if (nodeConfig.condition && !nodeConfig.condition(this.context)) {
          this.context.skippedNodes.push(nodeConfig.id);
          continue;
        }

        if (this.context.runOverrides.skipNodes?.includes(nodeConfig.id)) {
          this.context.skippedNodes.push(nodeConfig.id);
          continue;
        }

        await this.executeNode(nodeConfig);

        if (this.context.status === 'awaiting_review') {
          return this.context;
        }
      }

      if (this.context.status === 'running') {
        this.context.status = 'completed';
      }

    } catch (error) {
      this.context.status = 'failed';
      throw error;
    }

    return this.context;
  }

  // === Node Execution (Loop-Based) ===

  private async executeNode(nodeConfig: PipelineNodeConfig): Promise<void> {
    const node = nodeRegistry.get(nodeConfig.nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeConfig.nodeId}`);
    }

    this.context.currentNode = nodeConfig.id;
    this.emitProgress();

    let shouldContinue = true;

    while (shouldContinue) {
      this.context.retry = { attemptNumber: 1, maxAttempts: 3, lastError: undefined };

      const result = await this.executeWithRetries(node, nodeConfig);

      if (!isSuccessResult(result)) {
        if (this.context.config.intervention.defaults.pauseOnError) {
          this.context.status = 'awaiting_review';

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
  }

  // === Retry Logic ===

  private async executeWithRetries(
    node: any,
    nodeConfig: PipelineNodeConfig
  ): Promise<NodeResult<unknown>> {
    const input = this.buildNodeInput(node, nodeConfig);
    const config = this.getNodeConfig(nodeConfig);

    let result: NodeResult<unknown> = {
      success: false,
      error: { code: 'NO_ATTEMPTS', message: 'No execution attempts made', retryable: false },
    };

    while (this.context.retry.attemptNumber <= this.context.retry.maxAttempts) {
      result = await node.execute(input, config, this.context, {
        signal: this.options.signal,
        onProgress: (progress: any) => this.emitProgress(progress),
        onLog: (entry: any) => this.context.services.logger.log(entry.level, entry.message, entry.data),
      });

      if (isSuccessResult(result)) break;
      if (!result.error.retryable) break;
      if (this.context.retry.attemptNumber >= this.context.retry.maxAttempts) break;

      this.context.retry.attemptNumber++;
      this.context.retry.lastError = result.error;
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

  // === Helpers ===

  private resolveExecutionOrder(): PipelineNodeConfig[] {
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

  private buildNodeInput(node: any, nodeConfig: PipelineNodeConfig): unknown {
    if (node.getInputFromContext) {
      return node.getInputFromContext(this.context);
    }
    return {
      ...this.context.previousOutputs,
      runOverrides: this.context.runOverrides,
    };
  }

  private getNodeConfig(nodeConfig: PipelineNodeConfig): unknown {
    const baseConfig = (this.context.config as any)[nodeConfig.nodeId];
    const overrides = this.context.runOverrides.nodeOverrides?.[nodeConfig.id];
    return overrides ? { ...baseConfig, ...overrides } : baseConfig ?? {};
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

  private emitProgress(nodeProgress?: { percent: number; message: string }): void {
    const completedCount = this.context.completedNodes.length;
    const totalCount = this.pipeline.nodes.length;

    const update: RunProgressUpdate = {
      runId: this.context.runId,
      status: this.context.status,
      currentNode: this.context.currentNode,
      completedNodes: this.context.completedNodes,
      overallPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      nodeProgress,
    };

    this.options.onProgress?.(update);
    this.emit('progress', update);
  }
}

// === Errors ===

export class NodeExecutionError extends Error {
  constructor(
    public nodeId: string,
    public nodeError: NodeError
  ) {
    super(`Execution failed for ${nodeId}: ${nodeError.message}`);
    this.name = 'NodeExecutionError';
  }
}

export class NodeValidationError extends Error {
  constructor(
    public nodeId: string,
    public errors: { field: string; message: string }[]
  ) {
    super(`Validation failed for ${nodeId}: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'NodeValidationError';
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test:run src/lib/orchestrator/__tests__/orchestrator.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: implement PipelineOrchestrator with execution, retries, and interventions"
```

---

## Phase 7: Trigger Node (Minimal Implementation)

### Task 7.1: Implement Trigger Node

**Files:**
- Create: `src/lib/nodes/trigger/index.ts`
- Create: `src/lib/nodes/trigger/types.ts`
- Test: `src/lib/nodes/trigger/__tests__/trigger.test.ts`

**Step 1: Create types**

Create `src/lib/nodes/trigger/types.ts`:
```typescript
import { z } from 'zod';

export const TriggerInputSchema = z.object({
  topic: z.string().min(3).max(200),
  archetypeId: z.string().default('explainer'),
  sourceType: z.enum(['manual', 'scheduled', 'webhook', 'nicheradar']).default('manual'),
  sourceData: z.record(z.unknown()).optional(),
});

export const TriggerOutputSchema = z.object({
  topic: z.string(),
  archetypeId: z.string(),
  sourceType: z.enum(['manual', 'scheduled', 'webhook', 'nicheradar']),
  sourceData: z.record(z.unknown()).optional(),
});

export const TriggerConfigSchema = z.object({
  defaultArchetype: z.string().default('explainer'),
});

export type TriggerInput = z.infer<typeof TriggerInputSchema>;
export type TriggerOutput = z.infer<typeof TriggerOutputSchema>;
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;
```

**Step 2: Write test**

Create `src/lib/nodes/trigger/__tests__/trigger.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { TriggerNode } from '../index';
import { createInitialRunContext } from '@/lib/nodes/context';

describe('TriggerNode', () => {
  const node = new TriggerNode();

  it('has correct metadata', () => {
    expect(node.meta.id).toBe('trigger');
    expect(node.meta.category).toBe('trigger');
  });

  it('validates valid input', () => {
    const context = createInitialRunContext({ userId: 'user', projectId: 'project' });
    const result = node.validate(
      { topic: 'Test Topic', archetypeId: 'explainer', sourceType: 'manual' },
      {},
      context
    );
    expect(result.valid).toBe(true);
  });

  it('returns warning for short topic', () => {
    const context = createInitialRunContext({ userId: 'user', projectId: 'project' });
    const result = node.validate(
      { topic: 'Hi', archetypeId: 'explainer', sourceType: 'manual' },
      {},
      context
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('executes and returns output', async () => {
    const context = createInitialRunContext({ userId: 'user', projectId: 'project' });
    const result = await node.execute(
      { topic: 'Test Topic', archetypeId: 'explainer', sourceType: 'manual' },
      {},
      context
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.topic).toBe('Test Topic');
      expect(result.output.archetypeId).toBe('explainer');
    }
  });

  it('estimates zero cost (no API calls)', () => {
    const estimate = node.estimateCost(
      { topic: 'Test', archetypeId: 'explainer', sourceType: 'manual' },
      {}
    );
    expect(estimate.total).toBe(0);
  });
});
```

**Step 3: Run test to verify it fails**

```bash
pnpm test:run src/lib/nodes/trigger/__tests__/trigger.test.ts
```

Expected: FAIL

**Step 4: Implement trigger node**

Create `src/lib/nodes/trigger/index.ts`:
```typescript
import type { z } from 'zod';
import type { NodeContract, NodeMeta, ValidationResult, CostEstimate, NodeResult, ExecutionOptions } from '../base';
import type { RunContext } from '../context';
import { TriggerInputSchema, TriggerOutputSchema, TriggerConfigSchema } from './types';

export class TriggerNode implements NodeContract<
  typeof TriggerInputSchema,
  typeof TriggerOutputSchema,
  typeof TriggerConfigSchema
> {
  meta: NodeMeta = {
    id: 'trigger',
    name: 'Trigger',
    description: 'Initiates a pipeline run with a topic and archetype',
    icon: 'Play',
    category: 'trigger',
    requiredCredentials: [],
    estimatedDuration: '<1s',
  };

  inputSchema = TriggerInputSchema;
  outputSchema = TriggerOutputSchema;
  configSchema = TriggerConfigSchema;

  validate(
    input: z.infer<typeof TriggerInputSchema>,
    config: z.infer<typeof TriggerConfigSchema>,
    context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Topic validation
    if (input.topic.length < 10) {
      warnings.push({
        field: 'topic',
        message: 'Topic is very short — script may lack specificity',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  estimateCost(
    input: z.infer<typeof TriggerInputSchema>,
    config: z.infer<typeof TriggerConfigSchema>
  ): CostEstimate {
    return {
      estimated: true,
      breakdown: [],
      total: 0,
      confidence: 'high',
    };
  }

  async execute(
    input: z.infer<typeof TriggerInputSchema>,
    config: z.infer<typeof TriggerConfigSchema>,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<z.infer<typeof TriggerOutputSchema>>> {
    const startedAt = new Date();

    options?.onProgress?.({ percent: 50, message: 'Processing trigger...' });

    const output = {
      topic: input.topic.trim(),
      archetypeId: input.archetypeId || config.defaultArchetype || 'explainer',
      sourceType: input.sourceType,
      sourceData: input.sourceData,
    };

    const completedAt = new Date();

    options?.onProgress?.({ percent: 100, message: 'Trigger complete' });

    return {
      success: true,
      output,
      metadata: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        actualCost: { estimated: true, breakdown: [], total: 0, confidence: 'high' },
        apiCalls: [],
      },
    };
  }

  getInputFromContext(context: RunContext): z.infer<typeof TriggerInputSchema> {
    // Trigger is first node, so input comes from runOverrides or defaults
    return {
      topic: (context.runOverrides as any).topic || '',
      archetypeId: (context.runOverrides as any).archetypeId || 'explainer',
      sourceType: 'manual',
    };
  }
}

// Export for registration
export { TriggerInputSchema, TriggerOutputSchema, TriggerConfigSchema } from './types';
```

**Step 5: Run test to verify it passes**

```bash
pnpm test:run src/lib/nodes/trigger/__tests__/trigger.test.ts
```

Expected: PASS

**Step 6: Register the node**

Update `src/lib/nodes/registry.ts` to auto-register:
```typescript
import type { NodeContract } from './base';
import { TriggerNode } from './trigger';

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
nodeRegistry.register(new TriggerNode());
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: implement Trigger node"
```

---

## Checkpoint: Run All Tests

Before proceeding, ensure all tests pass:

```bash
pnpm test:run
```

Expected: All tests PASS

If any fail, fix before continuing.

---

## Summary

**Phases 1-7 Complete:**

| Phase | Component | Status |
|-------|-----------|--------|
| 1 | Project setup | Complete |
| 2 | Core types & node contract | Complete |
| 3 | Config resolution | Complete |
| 4 | Node registry | Complete |
| 5 | Pipeline definitions | Complete |
| 6 | Orchestrator | Complete |
| 7 | Trigger node | Complete |

**Next phases (not in this plan):**
- Phase 8: Script node implementation
- Phase 9: Database schema & Supabase setup
- Phase 10: API endpoints
- Phase 11: Additional nodes (voice, thumbnail, etc.)
- Phase 12: UI components

---

**Plan complete and saved to `docs/plans/2026-01-05-vidflow-implementation-plan.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
