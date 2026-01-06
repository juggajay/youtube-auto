# Implementation Order

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

## Phase 1: Foundation (Week 1)

### 1.1 Database Schema
- [ ] Create Supabase migration for `runs` table
- [ ] Create migration for `run_node_configs` table
- [ ] Create migration for `channel_bibles` table
- [ ] Create migration for `templates` table
- [ ] Create migration for `interventions` table
- [ ] Create migration for `youtube_connections` table
- [ ] Generate TypeScript types from schema
- [ ] Test: Verify all tables created, CRUD operations work

### 1.2 Zustand Stores
- [ ] Create `src/stores/runInitStore.ts`
- [ ] Create `src/stores/nodeConfigStore.ts`
- [ ] Create `src/stores/runStore.ts`
- [ ] Test: Store state updates correctly

### 1.3 Pre-Run Modal - Basic
- [ ] Create `RunInitiationModal.tsx` container
- [ ] Create `VideoIdeaForm.tsx` with expandable details
- [ ] Create `InterventionCheckboxes.tsx`
- [ ] Wire modal to store
- [ ] Test: Modal opens, form captures input, checkboxes toggle

## Phase 2: Node Panels (Week 2)

### 2.1 Panel Infrastructure
- [ ] Create `NodePanelContainer.tsx` slide-out drawer
- [ ] Add panel open/close to pipeline editor
- [ ] Style panel transitions
- [ ] Test: Panel opens when node clicked

### 2.2 Script Panel (9 tabs)
- [ ] Create `ScriptPanel.tsx` container with tabs
- [ ] Create `ArchetypeTab.tsx`
- [ ] Create `StructureTab.tsx` with drag-drop
- [ ] Create `HooksTab.tsx`
- [ ] Create `TitlesTab.tsx`
- [ ] Create `DescriptionTab.tsx`
- [ ] Create `TagsTab.tsx`
- [ ] Create `AIModelTab.tsx`
- [ ] Create `BibleOverrideTab.tsx`
- [ ] Create `AdvancedTab.tsx`
- [ ] Test: All tabs render, config saves to store

### 2.3 Voice Panel
- [ ] Create `VoicePanel.tsx` container
- [ ] Create `VoiceSelectionTab.tsx` with ElevenLabs API
- [ ] Create `SpeechSettingsTab.tsx`
- [ ] Create `PronunciationTab.tsx`
- [ ] Create `OutputTab.tsx`
- [ ] Test: Voice list loads, preview plays

### 2.4 Thumbnail Panel
- [ ] Create `ThumbnailPanel.tsx` container
- [ ] Create `GeneratorTab.tsx`
- [ ] Create `StyleTab.tsx` with reference images
- [ ] Create `TextTab.tsx`
- [ ] Create `BrandTab.tsx`
- [ ] Create `OutputTab.tsx`
- [ ] Test: All generators selectable, reference upload works

### 2.5 Assembly Panel
- [ ] Create `AssemblyPanel.tsx` container
- [ ] Create `VisualSourceTab.tsx`
- [ ] Create `StructureTab.tsx`
- [ ] Create `CaptionsTab.tsx`
- [ ] Create `MusicTab.tsx`
- [ ] Create `OutputTab.tsx`
- [ ] Test: Config saves, music preview works

### 2.6 Publish Panel
- [ ] Create `PublishPanel.tsx` container
- [ ] Create `PlatformTab.tsx` with channel selector
- [ ] Create `MetadataTab.tsx`
- [ ] Create `ScheduleTab.tsx`
- [ ] Create `AdvancedTab.tsx`
- [ ] Test: Channels load, visibility toggles

## Phase 3: Channel Bible (Week 3)

### 3.1 Channel Bible Editor
- [ ] Create `ChannelBibleEditor.tsx` page
- [ ] Create `ToneSliders.tsx` (4 sliders)
- [ ] Create `VocabularySection.tsx`
- [ ] Create `ExampleScriptsSection.tsx`
- [ ] Create `ContentDefaultsSection.tsx`
- [ ] Create API route `GET/PUT /api/settings/bible`
- [ ] Test: Bible saves, loads, sliders work

### 3.2 Integration
- [ ] Add Channel Bible to settings page navigation
- [ ] Wire Bible Override tab in Script panel
- [ ] Test: Bible data flows to script generation

## Phase 4: Run Execution (Week 4)

### 4.1 SSE Streaming
- [ ] Create API route `GET /api/runs/[id]/stream`
- [ ] Implement SSE event types (progress, log, intervention, complete, error)
- [ ] Create `useRunStream.ts` hook
- [ ] Test: Events flow, reconnection works

### 4.2 Run Progress View
- [ ] Create `RunProgressView.tsx`
- [ ] Create `PipelineProgress.tsx` visualization
- [ ] Create `NodeProgressCard.tsx`
- [ ] Create `LogStream.tsx`
- [ ] Create `CostTracker.tsx`
- [ ] Create `RunControls.tsx` (pause, abort)
- [ ] Test: Progress updates in real-time

### 4.3 Intervention Modals
- [ ] Create `InterventionContainer.tsx` router
- [ ] Create `ScriptReviewModal.tsx` (full editor)
- [ ] Create `ThumbnailReviewModal.tsx` (grid selector)
- [ ] Create `PublishReviewModal.tsx` (final confirm)
- [ ] Create API route `POST /api/runs/[id]/intervene`
- [ ] Test: Each intervention type works, responses save

## Phase 5: Templates (Week 5)

### 5.1 Templates Page
- [ ] Create `/templates` page
- [ ] Create `TemplateCard.tsx`
- [ ] Implement search, sort, filter
- [ ] Test: Templates list, filter works

### 5.2 Save/Load
- [ ] Create `SaveTemplateModal.tsx`
- [ ] Create `LoadTemplateModal.tsx`
- [ ] Add "Save as Template" button to pipeline editor
- [ ] Add "Load Template" to pre-run modal
- [ ] Test: Full save/load cycle works

## Phase 6: Settings & Integrations (Week 6)

### 6.1 YouTube OAuth
- [ ] Create API route `GET /api/auth/youtube`
- [ ] Create API route `GET /api/auth/youtube/callback`
- [ ] Create `YouTubeConnect.tsx` component
- [ ] Create `ConnectedChannels.tsx` list
- [ ] Encrypt tokens with Supabase Vault
- [ ] Test: Full OAuth flow, channel list loads

### 6.2 API Key Management
- [ ] Create `APIKeyManager.tsx` component
- [ ] Add ElevenLabs key input with test
- [ ] Add key encryption
- [ ] Test: Keys save, test connection works

### 6.3 Settings Page
- [ ] Create settings page with tabs
- [ ] Add Profile tab
- [ ] Add Channel Bible tab (link to editor)
- [ ] Add API Keys tab
- [ ] Add Billing tab (placeholder)
- [ ] Add Defaults tab
- [ ] Test: All tabs navigate correctly

## Phase 7: Polish & Testing (Week 7)

### 7.1 Dashboard
- [ ] Update dashboard with QuickStartCard
- [ ] Add RecentRunsWidget
- [ ] Add UsageStatsWidget
- [ ] Add TemplatesWidget
- [ ] Test: Dashboard loads, widgets update

### 7.2 Run History
- [ ] Create `/runs` history page
- [ ] Implement pagination
- [ ] Add status filters
- [ ] Add date range picker
- [ ] Test: History loads, filters work

### 7.3 Final Testing
- [ ] End-to-end test: Create run from template
- [ ] End-to-end test: Full pipeline with interventions
- [ ] End-to-end test: YouTube publish flow
- [ ] Performance test: Large log streams
- [ ] Mobile responsiveness check

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-01-06-vidflow-ui-v2/`**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
