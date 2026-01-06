# VidFlow UI/UX Implementation Plan v2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete UI/UX layer for VidFlow pipeline system with deep configuration, intervention controls, and templates.

**Architecture:** React components with Zustand stores, SSE streaming for real-time updates, Supabase for persistence. Each node gets a comprehensive config panel. Intervention system has type-specific modals.

**Tech Stack:** Next.js 14, React 18, Zustand, Tailwind CSS, shadcn/ui, Supabase, SSE

---

## Plan Structure

This plan is split across multiple files for manageability:

1. `01-database-schema.md` - Supabase tables and types
2. `02-pre-run-modal.md` - Run initiation with intervention checkboxes
3. `03-channel-bible.md` - Brand settings with sliders and examples
4. `04-node-panels-script.md` - Script node full config (9 tabs)
5. `05-node-panels-voice.md` - Voice node config
6. `06-node-panels-thumbnail.md` - Thumbnail node config
7. `07-node-panels-assembly.md` - Assembly node config
8. `08-node-panels-publish.md` - Publish node config
9. `09-intervention-modals.md` - Type-specific intervention views
10. `10-run-progress.md` - Real-time execution view
11. `11-templates-system.md` - Save/load pipeline templates
12. `12-implementation-order.md` - Task sequence and timeline

---

## Key Design Decisions

### Intervention Checkboxes (Core Feature)
Users control pipeline autonomy via checkboxes in pre-run modal:
- ☐ Review script before voice generation
- ☐ Review thumbnail options before selection
- ☐ Review everything before publish

Checked = pipeline pauses at that node. Unchecked = fully autonomous.

### Node Panels Depth
Each node panel has 6-9 tabs covering ALL configuration. Users click node → see everything. No hidden settings.

### Channel Bible with Examples
Example scripts are CRITICAL - they teach AI your voice by demonstration, not description.

### Templates
Save entire pipeline config as reusable template. One-click to recreate setup.
