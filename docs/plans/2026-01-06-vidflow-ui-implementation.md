# VidFlow UI/UX Implementation Plan

**Created:** 2026-01-06
**Status:** Ready for Review
**Scope:** Missing UI components for complete pipeline workflow

---

## Overview

This plan covers the UI/UX components needed to bridge the existing backend infrastructure with user interaction. The backend (nodes, orchestrator, config resolution) is complete. This plan focuses on the frontend experience.

---

## Phase 1: Pre-Run Modal System

### 1.1 Run Initiation Modal

**Purpose:** Collect topic, select archetype, confirm costs before pipeline execution.

**Components:**
```
src/components/run/
├── RunInitiationModal.tsx      # Main modal container
├── TopicInput.tsx              # Topic/idea text input
├── ArchetypeSelector.tsx       # Visual archetype picker
├── CostEstimator.tsx           # Real-time cost breakdown
└── index.ts                    # Barrel export
```

**TopicInput Features:**
- Multiline textarea for topic/idea
- Optional URL paste for reference videos
- Character count with suggested length
- "Enhance with AI" button to expand brief ideas

**ArchetypeSelector Features:**
- Grid of archetype cards from `docs/archetypes.json`
- Visual preview of each format
- Hover shows: typical length, tone, structure
- Selected state with accent border

**CostEstimator Features:**
- Per-node cost breakdown (API calls)
- Toggle nodes on/off to adjust estimate
- Shows user's remaining credits/budget
- Warning states for high-cost runs

**Data Flow:**
```
TopicInput → state.topic
ArchetypeSelector → state.archetype
CostEstimator → reads both, calculates estimate
Submit → POST /api/runs/create with { topic, archetype, nodeConfig }
```

### 1.2 Channel Bible Integration

**Purpose:** Pull user's brand guidelines into script generation.

**Components:**
```
src/components/settings/
├── ChannelBibleEditor.tsx      # Full editor page
├── BibleSection.tsx            # Collapsible section component
├── VoicePersonalityForm.tsx    # Tone, style, persona
├── ContentGuidelinesForm.tsx   # Topics, restrictions
└── BrandAssetsForm.tsx         # Colors, fonts, logos
```

**Bible Sections:**
1. **Channel Identity** - Name, tagline, niche
2. **Voice & Personality** - Tone, humor level, energy, persona
3. **Content Guidelines** - Allowed topics, forbidden topics, competitor mentions
4. **Brand Assets** - Primary colors, fonts, logo URLs
5. **Audience Profile** - Demographics, pain points, desires
6. **Call-to-Actions** - Standard CTAs, subscribe prompts

**Storage:** Supabase `channel_bibles` table, one per user, JSON column for flexible schema.

---

## Phase 2: Node Configuration Panels

### 2.1 Panel Architecture

**Pattern:** Slide-out drawer from right side when node is selected.

**Components:**
```
src/components/nodes/panels/
├── NodePanelContainer.tsx      # Drawer wrapper
├── ScriptConfigPanel.tsx       # Script node settings
├── VoiceConfigPanel.tsx        # Voice node settings
├── ThumbnailConfigPanel.tsx    # Thumbnail node settings
├── AssemblyConfigPanel.tsx     # Assembly node settings
├── PublishConfigPanel.tsx      # Publish node settings
└── index.ts
```

**Panel Container Features:**
- Slide-out animation (300ms ease)
- Close on click outside or ESC
- Resizable width (drag handle)
- Tab sections for complex nodes

### 2.2 Script Config Panel

**Sections:**
1. **Generation Settings**
   - Tone slider (casual ↔ professional)
   - Length selector (short/medium/long)
   - Custom instructions textarea

2. **Channel Bible Override**
   - Toggle "Use Channel Bible"
   - Override specific sections inline

3. **Advanced**
   - Temperature slider (creativity)
   - Include timestamps checkbox
   - Reference videos input

### 2.3 Voice Config Panel

**Sections:**
1. **Voice Selection**
   - ElevenLabs voice picker (API key required)
   - Preview audio button
   - Clone voice option

2. **Speech Settings**
   - Speed slider (0.5x - 2x)
   - Stability slider
   - Clarity slider

3. **Output Format**
   - Audio format (mp3/wav)
   - Sample rate selection

### 2.4 Thumbnail Config Panel

**Sections:**
1. **Style Selection**
   - Template picker (grid)
   - Upload reference images
   - Color scheme picker

2. **Text Options**
   - Title text override
   - Font selection
   - Text position presets

3. **Generation Settings**
   - Number of variations (1-4)
   - Aspect ratio selector

### 2.5 Assembly Config Panel

**Sections:**
1. **Video Structure**
   - Intro/outro toggle
   - Background music selector
   - Transition style picker

2. **Visual Settings**
   - Resolution selector
   - Frame rate
   - Output format

3. **Advanced**
   - Custom FFmpeg flags
   - Watermark settings

### 2.6 Publish Config Panel

**Sections:**
1. **Platform Settings**
   - YouTube channel selector (connected accounts)
   - Visibility (public/unlisted/private)
   - Schedule datetime picker

2. **Metadata**
   - Title editor with character count
   - Description editor with templates
   - Tags input with suggestions

3. **Advanced**
   - Category selector
   - Monetization settings
   - Shorts toggle

---

## Phase 3: Run Execution View

### 3.1 Progress Dashboard

**Purpose:** Real-time feedback during pipeline execution.

**Components:**
```
src/components/run/
├── RunProgressView.tsx         # Main run view
├── NodeProgressCard.tsx        # Per-node status
├── LogStream.tsx               # Live log output
├── CostTracker.tsx             # Running cost total
└── InterventionModal.tsx       # Pause for human input
```

**RunProgressView Features:**
- Pipeline visualization with active node highlighted
- Progress bar per node (0-100%)
- Overall progress indicator
- Elapsed time and estimated remaining
- Abort button (with confirmation)

**NodeProgressCard States:**
- `pending` - Gray, waiting
- `running` - Blue, animated pulse
- `intervention` - Yellow, attention needed
- `completed` - Green, checkmark
- `failed` - Red, error icon
- `skipped` - Gray, strikethrough

### 3.2 Real-Time Streaming

**Implementation:**
- Server-Sent Events (SSE) from `/api/runs/[id]/stream`
- Event types: `progress`, `log`, `intervention`, `complete`, `error`
- Reconnection logic with exponential backoff

**Event Schema:**
```typescript
type RunEvent =
  | { type: 'progress'; nodeId: string; percent: number }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'intervention'; nodeId: string; question: string; options: string[] }
  | { type: 'complete'; outputs: Record<string, unknown> }
  | { type: 'error'; nodeId: string; error: string }
```

### 3.3 Intervention System

**Purpose:** Pause execution for human approval or input.

**InterventionModal Features:**
- Displays AI's question/request
- Shows context (what node, what it generated)
- Option buttons for quick responses
- Text input for custom instructions
- "Continue with current" default option
- Timeout with auto-proceed option

**Intervention Points:**
1. **Script Review** - Show generated script, allow edits
2. **Thumbnail Selection** - Display options, pick favorite
3. **Pre-Publish Review** - Final check before upload
4. **Error Recovery** - Retry, skip, or abort options

---

## Phase 4: Output Review & Download

### 4.1 Run Results View

**Components:**
```
src/components/run/
├── RunResultsView.tsx          # Post-run summary
├── OutputPreview.tsx           # Media previews
├── DownloadPanel.tsx           # Export options
└── RunHistoryItem.tsx          # For history list
```

**RunResultsView Features:**
- Summary card with total cost, duration
- Per-node output previews
- Regenerate individual nodes button
- "Create Similar" to clone settings

### 4.2 Output Previews

**Per Node Type:**
- **Script** - Formatted text with copy button
- **Voice** - Audio player with waveform
- **Thumbnail** - Image grid with zoom
- **Assembly** - Video player
- **Publish** - YouTube link and embed

### 4.3 Download Options

- Individual node outputs
- Complete package (ZIP)
- Share link generation
- Export to cloud storage

---

## Phase 5: Dashboard & History

### 5.1 Dashboard Redesign

**Components:**
```
src/components/dashboard/
├── DashboardView.tsx           # Main dashboard
├── QuickStartCard.tsx          # New run shortcut
├── RecentRunsWidget.tsx        # Last 5 runs
├── UsageStatsWidget.tsx        # Credits, API usage
└── TemplatesWidget.tsx         # Saved templates
```

**QuickStartCard:**
- "Start New Run" primary button
- Recent topic suggestions
- Favorite archetype quick-picks

**RecentRunsWidget:**
- Run status badges
- Click to view/resume
- Quick actions (duplicate, delete)

### 5.2 Run History Page

**Features:**
- Searchable, filterable list
- Date range picker
- Status filter tabs
- Bulk actions (export, delete)
- Pagination

---

## Phase 6: Settings & Integrations

### 6.1 Settings Page Structure

**Tabs:**
1. **Profile** - User info, preferences
2. **Channel Bible** - Brand settings
3. **API Keys** - ElevenLabs, YouTube
4. **Billing** - Usage, credits, upgrade
5. **Defaults** - Default node configs

### 6.2 YouTube Connection

**OAuth Flow:**
1. Click "Connect YouTube"
2. Redirect to Google OAuth
3. Callback saves tokens to Supabase
4. Display connected channels

**Components:**
```
src/components/settings/
├── YouTubeConnect.tsx          # OAuth trigger
├── ConnectedChannels.tsx       # List of channels
└── ChannelPermissions.tsx      # Scope management
```

### 6.3 API Key Management

**Features:**
- Secure input (masked)
- Test connection button
- Usage stats per key
- Key rotation support

---

## Implementation Order

**Week 1: Foundation**
- [ ] Run Initiation Modal (1.1)
- [ ] Basic Node Panel Container (2.1)
- [ ] Script Config Panel (2.2)

**Week 2: Core Flow**
- [ ] Run Progress View (3.1)
- [ ] SSE Streaming (3.2)
- [ ] Basic Intervention Modal (3.3)

**Week 3: Node Panels**
- [ ] Voice Config Panel (2.3)
- [ ] Thumbnail Config Panel (2.4)
- [ ] Assembly Config Panel (2.5)
- [ ] Publish Config Panel (2.6)

**Week 4: Polish**
- [ ] Run Results View (4.1)
- [ ] Channel Bible Editor (1.2)
- [ ] Dashboard Widgets (5.1)

**Week 5: Settings**
- [ ] YouTube OAuth (6.2)
- [ ] API Key Management (6.3)
- [ ] Run History (5.2)

---

## Technical Notes

### State Management

Use Zustand stores:
```
src/stores/
├── runStore.ts         # Active run state
├── configStore.ts      # Node configurations
├── uiStore.ts          # Modal/drawer state
└── settingsStore.ts    # User preferences
```

### API Routes

New routes needed:
```
/api/runs/create        POST    Create new run
/api/runs/[id]          GET     Get run details
/api/runs/[id]/stream   GET     SSE progress stream
/api/runs/[id]/intervene POST   Submit intervention response
/api/settings/bible     GET/PUT Channel bible CRUD
/api/auth/youtube       GET     OAuth initiate
/api/auth/youtube/callback GET  OAuth callback
```

### Component Library

Extend shadcn/ui with:
- Slider with labels
- Audio player
- Video player
- Image grid with lightbox
- Drawer/slide-panel

---

## Success Criteria

1. User can start a run from dashboard in < 3 clicks
2. Real-time progress visible with < 500ms latency
3. All node configs accessible via panels
4. Interventions pause and resume correctly
5. YouTube publish flow completes end-to-end
6. Channel Bible persists and affects script output

---

## File Path

This document: `docs/plans/2026-01-06-vidflow-ui-implementation.md`
