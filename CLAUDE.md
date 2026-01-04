# CLAUDE.md

## Project Overview

VidFlow is a modular YouTube video production pipeline. Users connect nodes (trigger → script → voice → thumbnail → assembly → publish) to automate any part of their workflow.

**Core Principle:** Full automation is possible, but every node can be customized, skipped, or manually overridden.

## Reference Documents

Read these before making architectural decisions:

- `docs/prd.md` — Full product requirements, user journeys, node specifications
- `docs/archetypes.json` — Viral video templates for script generation

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand for client state
- **APIs:**
  - Claude API (script generation)
  - ElevenLabs (voice)
  - Google Gemini (thumbnails, image analysis)
  - YouTube Data API (publishing)
  - FFmpeg (video assembly)

## Project Structure

```
vidflow/
├── app/                    # Next.js app router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Main app pages
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn components
│   ├── nodes/             # Node-specific components
│   ├── workflow/          # Workflow builder components
│   └── shared/            # Shared components
├── lib/
│   ├── nodes/             # Node implementations
│   │   ├── base.ts        # Base node contract
│   │   ├── script/        # Script generator node
│   │   ├── voice/         # Voice generator node
│   │   ├── thumbnail/     # Thumbnail generator node
│   │   ├── assembly/      # Video assembly node
│   │   └── publish/       # Publish node
│   ├── db/                # Supabase client + queries
│   ├── api/               # External API wrappers
│   └── utils/             # Helpers
├── types/                 # TypeScript types
├── docs/                  # Documentation
└── supabase/
    └── migrations/        # Database migrations
```

## Node Architecture

All nodes extend a base contract:

```typescript
interface NodeContract<TInput, TOutput, TConfig> {
  id: string;
  name: string;

  // What this node needs
  inputSchema: ZodSchema<TInput>;
  configSchema: ZodSchema<TConfig>;

  // What this node produces
  outputSchema: ZodSchema<TOutput>;

  // Execution
  execute(input: TInput, config: TConfig, context: RunContext): Promise<TOutput>;

  // Validation
  validate(input: TInput, config: TConfig): ValidationResult;

  // Cost estimation
  estimateCost(input: TInput, config: TConfig): CostEstimate;
}
```

## Configuration Hierarchy

Configuration cascades (later overrides earlier):

1. **System defaults** — Hardcoded sensible defaults
2. **User defaults** — User's global preferences
3. **Project defaults** — Channel bible, brand guidelines, voice settings
4. **Template defaults** — Fixed structure when using template
5. **Run overrides** — Per-execution instructions

When building config resolution, always merge in this order.

## Key Patterns

### Database Operations
```typescript
// Always use server-side Supabase client for mutations
import { createServerClient } from '@/lib/db/server';

// Use client-side for reads in components
import { createBrowserClient } from '@/lib/db/client';
```

### API Routes
```typescript
// All API routes follow this pattern
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate with Zod
    // Execute logic
    // Return response
  } catch (error) {
    // Structured error handling
  }
}
```

### Node Execution
```typescript
// Nodes are executed via the orchestrator
const orchestrator = new PipelineOrchestrator(runContext);
const result = await orchestrator.executeNode('script', input);
// Result is saved to run context automatically
```

## Do NOT

- **Don't hardcode API keys** — Always use environment variables
- **Don't skip Zod validation** — All inputs must be validated
- **Don't bypass config hierarchy** — Always resolve config through the cascade
- **Don't store videos long-term** — Upload to user's storage, keep only references
- **Don't auto-publish** — Always require explicit user approval for publishing
- **Don't mix node concerns** — Each node does one thing, passes to next

## Do

- **Do persist run state** — User can close browser and resume
- **Do estimate costs** — Show user expected API costs before run
- **Do allow skipping** — Any node can be skipped with manual input
- **Do log everything** — Full audit trail for debugging
- **Do handle partial failure** — One node failing shouldn't lose previous work
- **Do use TypeScript strictly** — No `any` types, full type coverage

## API Key Management

Users provide their own API keys for:
- ElevenLabs (voice generation)
- YouTube (publishing)

We provide (usage-limited):
- Claude API (script generation)
- Gemini API (thumbnails)

Keys are encrypted at rest using Supabase Vault.

## Testing

```bash
# Run tests
pnpm test

# Run specific node tests
pnpm test:node script
pnpm test:node voice

# E2E pipeline test
pnpm test:e2e
```

## Common Tasks

### Adding a new node

1. Create directory in `lib/nodes/[node-name]/`
2. Implement `NodeContract` interface
3. Add Zod schemas for input/output/config
4. Register in `lib/nodes/registry.ts`
5. Add UI component in `components/nodes/`
6. Add tests

### Adding a new archetype

1. Add to `docs/archetypes.json`
2. Update script node prompts to handle new structure
3. Add thumbnail style mapping if needed

### Modifying config hierarchy

1. Update types in `types/config.ts`
2. Update resolution logic in `lib/config/resolve.ts`
3. Update any affected node configs
4. Run full test suite

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs (server-side only)
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# User-provided (stored encrypted in DB)
# ELEVENLABS_API_KEY — per user
# YOUTUBE_OAUTH_TOKEN — per user
```
