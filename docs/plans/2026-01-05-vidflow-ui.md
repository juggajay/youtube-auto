# VidFlow UI/UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an award-winning, premium YouTube automation UI that rivals Linear/Vercel/Stripe in polish and feels worth $99/month.

**Architecture:** Next.js 16 App Router with React Flow for pipeline editing, Framer Motion for animations, Tailwind CSS v4 for styling, next-themes for dark/light modes, Zustand for state. Component-driven with a strong design system foundation.

**Tech Stack:** Next.js 16, React 19, @xyflow/react, framer-motion, next-themes, zustand, tailwindcss v4, lucide-react

---

## Design Philosophy: "Cinematic Studio"

### The Aesthetic
- **Dark Mode**: Professional editing suite vibe (DaVinci Resolve meets Linear). Deep blacks, vibrant accent colors, subtle glows.
- **Light Mode**: Premium creative tool (Figma meets Notion). Warm cream backgrounds, refined shadows, sophisticated restraint.
- **Common**: Both modes share the same bold typography, color-coded nodes, and attention to micro-interactions.

### The Unforgettable Elements
1. **Living YouTube Watermark**: Not a static image — a constellation of particles forming the play button that subtly pulses and flows. Different treatment for each theme.
2. **Flowing Edges**: Data visualized as particles traveling along connection paths between nodes.
3. **Breathing Nodes**: Subtle scale/glow animations on active nodes.
4. **Orchestrated Reveals**: Page loads feel choreographed with staggered animations.

### Typography
- **Display**: "Clash Display" — bold, geometric, memorable
- **Body**: "Satoshi" — clean, readable, modern
- **Mono**: "JetBrains Mono" — technical, precise

### Node Color System
| Node | Color | RGB | Usage |
|------|-------|-----|-------|
| Trigger | Electric Cyan | #00d4ff | 0, 212, 255 |
| Script | Rich Violet | #8b5cf6 | 139, 92, 246 |
| Voice | Warm Amber | #f59e0b | 245, 158, 11 |
| Thumbnail | Hot Pink | #ec4899 | 236, 72, 153 |
| Assembly | Emerald | #10b981 | 16, 185, 129 |
| Publish | YouTube Red | #ff0000 | 255, 0, 0 |

---

## Phase 1: Design System Foundation

### Task 1.1: Global CSS & Theme System

**Files:**
- Replace: `src/app/globals.css`

**Step 1: Create comprehensive CSS variables**

Complete CSS file with:
- CSS custom properties for colors, typography, spacing, shadows
- Dark theme (default) with deep blacks and vibrant accents
- Light theme with warm creams and refined contrast
- Animation keyframes for all micro-interactions
- Utility classes for common patterns
- React Flow overrides for custom styling

Key animations to define:
- `@keyframes constellation` — YouTube watermark particle movement
- `@keyframes flowPulse` — Edge data flow animation
- `@keyframes nodeBreath` — Subtle node scale animation
- `@keyframes gradientShift` — Background gradient animation
- `@keyframes staggerFade` — Orchestrated page reveals

**Step 2: Verify CSS loads**

Run: `pnpm dev`
Check: No CSS errors in console

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): comprehensive design system with dual themes"
```

---

### Task 1.2: Layout Components

**Files:**
- Replace: `src/app/layout.tsx`
- Replace: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`

**Step 1: Build root layout**

Layout features:
- Google Fonts loaded in head (Clash Display, Satoshi, JetBrains Mono)
- ThemeProvider wrapper
- Flex layout with collapsible sidebar
- Background mesh gradient
- Noise texture overlay

**Step 2: Build sidebar**

Sidebar features:
- VidFlow logo with gradient and glow
- Navigation items with active state indicator (animated dot):
  - Dashboard (/)
  - Pipelines (/pipelines)
  - Runs (/runs)
  - Thumbnails (/thumbnails)
  - Templates (/templates)
  - Settings (/settings)
- Collapsible on mobile
- Theme toggle at bottom with smooth icon transition
- Subtle hover animations
- Hydration-safe (mounted check for theme)

**Step 3: Build header component**

Header features:
- Breadcrumb navigation
- Page title area
- Action buttons slot
- Search (optional, future)

**Step 4: Test layout renders**

Run: `pnpm dev`
Navigate: All pages should show sidebar + content area
Check: Theme toggle works, no hydration errors

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/layout/
git commit -m "feat(ui): layout components with sidebar and header"
```

---

## Phase 2: Pipeline Editor (Core Experience)

### Task 2.1: Custom Pipeline Node Component

**Files:**
- Replace: `src/components/pipeline/PipelineNode.tsx`

**Step 1: Build premium node component**

Node features:
- Glassmorphism card with gradient border
- Color-coded accent bar on left edge
- Icon with colored background glow
- Label and description
- Status indicator (dot/spinner/check)
- Connection handles with glow effect
- "Breathing" animation when running
- Hover state with lift and glow
- Selected state with ring

Props interface:
```typescript
interface PipelineNodeData {
  label: string;
  type: 'trigger' | 'script' | 'voice' | 'thumbnail' | 'assembly' | 'publish';
  description?: string;
  status?: 'idle' | 'running' | 'completed' | 'error' | 'waiting';
  progress?: number;
}
```

**Step 2: Verify node renders**

Run: `pnpm dev`
Navigate: `/pipelines`
Check: Nodes display with correct styling

**Step 3: Commit**

```bash
git add src/components/pipeline/PipelineNode.tsx
git commit -m "feat(ui): premium pipeline node with glassmorphism"
```

---

### Task 2.2: Animated Edge Component

**Files:**
- Replace: `src/components/pipeline/AnimatedEdge.tsx`

**Step 1: Build flowing edge**

Edge features:
- SVG path with gradient stroke
- Animated dashes that flow toward target
- Particle dots that travel along path
- Color based on source node type
- Glow effect when active
- Different states: idle, active, completed

**Step 2: Test edge animation**

Navigate: `/pipelines`
Check: Edges animate smoothly between nodes

**Step 3: Commit**

```bash
git add src/components/pipeline/AnimatedEdge.tsx
git commit -m "feat(ui): animated edges with flowing particles"
```

---

### Task 2.3: YouTube Watermark Component

**Files:**
- Create: `src/components/pipeline/YouTubeWatermark.tsx`

**Step 1: Build constellation watermark**

Two distinct treatments:

**Dark Mode:**
- Play button formed from animated dots (constellation effect)
- Dots gently drift and return to position
- Subtle purple/cyan gradient on dots
- Very low opacity (3-5%)
- Reacts subtly to pipeline activity (brighter when running)

**Light Mode:**
- Geometric/outline treatment
- Clean lines forming play button shape
- Warm gradient fill at low opacity
- More solid, less particle-based
- Elegant and refined

**Step 2: Test watermark**

Navigate: `/pipelines`
Check: Watermark visible in background, different in each theme

**Step 3: Commit**

```bash
git add src/components/pipeline/YouTubeWatermark.tsx
git commit -m "feat(ui): creative YouTube watermark with dual-theme treatment"
```

---

### Task 2.4: Pipeline Editor Page

**Files:**
- Replace: `src/app/pipelines/page.tsx`

**Step 1: Build editor page**

Page features:
- Header with pipeline name, status badge, cost estimate, save/run buttons
- React Flow canvas with custom node and edge types
- YouTube watermark component in background
- Custom styled controls (zoom, fit, minimap)
- Add node floating action button
- Node palette sidebar (draggable nodes)

Canvas configuration:
- Dot grid background with theme-appropriate color
- Smooth pan and zoom
- Fit view on load with padding
- Connection validation

**Step 2: Test editor**

Navigate: `/pipelines`
Check: Full editor renders, nodes draggable, edges connectable

**Step 3: Commit**

```bash
git add src/app/pipelines/page.tsx
git commit -m "feat(ui): pipeline editor with React Flow canvas"
```

---

## Phase 3: Dashboard

### Task 3.1: Dashboard Page

**Files:**
- Replace: `src/app/page.tsx`

**Step 1: Build dashboard**

Dashboard sections:

**Stats Grid (4 cards):**
- Videos Published (count + change)
- Pipelines Active (count + running now)
- Avg Production Time (duration + improvement)
- Success Rate (percentage + change)

Each stat card:
- Glassmorphism background
- Icon with colored glow
- Large number with display font
- Subtle change indicator
- Hover lift animation

**Recent Runs (main panel):**
- List of recent pipeline runs
- Status icon (color-coded)
- Title, status badge, timestamp
- Node progress dots (color-coded)
- Progress bar for running
- Click to view run details

**Quick Actions (sidebar):**
- Create new pipeline
- Browse templates
- Continue draft
- Each with icon, label, hover animation

**Pro Tip Card:**
- Gradient border
- Sparkle icon
- Helpful tip text

**Step 2: Add orchestrated animations**

Staggered reveal:
- Header fades in first
- Stats cards animate in sequence (0.05s delay each)
- Recent runs list animates after stats
- Quick actions animate last

**Step 3: Test dashboard**

Navigate: `/`
Check: All sections render, animations play on load

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(ui): dashboard with stats, runs, and orchestrated animations"
```

---

## Phase 4: Run View

### Task 4.1: Run View Page

**Files:**
- Replace: `src/app/runs/page.tsx`
- Create: `src/components/run/NodeTimeline.tsx`
- Create: `src/components/run/LogPanel.tsx`
- Create: `src/components/run/InterventionModal.tsx`

**Step 1: Build run view layout**

Page structure:
- Header: Run title, status badge, duration, abort button
- Main: Node timeline (vertical list of nodes with status)
- Sidebar: Real-time logs panel

**Step 2: Build NodeTimeline component**

Features:
- Vertical list of pipeline nodes
- Connection lines between nodes
- Status for each: pending, running (animated), completed, waiting, error
- Click waiting node to open intervention modal
- Progress indicator for running node
- Duration shown for completed nodes

**Step 3: Build LogPanel component**

Features:
- Scrolling log output
- Timestamp, level (info/warn/error/success), message
- Color-coded by level
- Auto-scroll to bottom
- Monospace font

**Step 4: Build InterventionModal component**

Features:
- Fullscreen modal with backdrop blur
- Shows node output (e.g., generated script)
- Editable textarea for modifications
- Stats (word count, duration estimate, reading level)
- Action buttons: Skip, Regenerate, Approve & Continue
- Smooth open/close animations

**Step 5: Test run view**

Navigate: `/runs`
Check: Timeline displays, clicking waiting node opens modal

**Step 6: Commit**

```bash
git add src/app/runs/page.tsx src/components/run/
git commit -m "feat(ui): run view with timeline, logs, and intervention modal"
```

---

## Phase 5: Thumbnail Editor

### Task 5.1: Thumbnail Editor Page

**Files:**
- Replace: `src/app/thumbnails/page.tsx`
- Replace: `src/components/thumbnail-generator/PromptInput.tsx`
- Replace: `src/components/thumbnail-generator/AspectRatioSelector.tsx`
- Replace: `src/components/thumbnail-generator/ImageGrid.tsx`
- Replace: `src/components/thumbnail-generator/ImageModal.tsx`
- Replace: `src/components/thumbnail-generator/YouTubeExtractor.tsx`
- Replace: `src/components/thumbnail-generator/GenerateButton.tsx`

**Step 1: Build premium page layout**

Page structure:
- Header with title "Thumbnail Studio" and subtitle
- Two-column layout on desktop: Controls (left), Results (right)
- Single column on mobile

**Step 2: Redesign PromptInput**

Features:
- Large glassmorphism textarea with gradient border on focus
- Floating label that animates up on focus
- Character count indicator
- Reference image pills (dragged images shown as small previews)
- Keyboard shortcuts hint (Ctrl+Enter to generate)
- Placeholder text with typing animation on first load

**Step 3: Redesign AspectRatioSelector**

Features:
- Pill-style toggle buttons (not dropdown)
- Visual preview of each ratio (small rectangles)
- Active state with gradient background and glow
- Smooth transition between selections
- Options: 16:9 (YouTube), 1:1 (Square), 9:16 (Shorts)

**Step 4: Redesign GenerateButton**

Features:
- Large primary button with gradient (Hot Pink for thumbnail)
- Particle burst animation on click
- Loading state with spinning ring
- Count selector (1x, 2x, 4x) as segmented control
- Glow effect on hover
- Disabled state when no prompt

**Step 5: Redesign YouTubeExtractor**

Features:
- Collapsible card section
- URL input with paste detection
- "Extract" button
- Preview of extracted thumbnail with video title
- Drag extracted thumbnail to use as reference
- Loading skeleton during fetch

**Step 6: Redesign ImageGrid**

Features:
- Masonry or responsive grid layout
- Image cards with:
  - Subtle shadow and border
  - Hover overlay with actions (View, Download, Use as Reference, Delete)
  - Prompt text on hover (bottom overlay)
  - Drag handle indicator
  - Status states: generating (skeleton shimmer), completed, failed (red tint)
- Empty state with illustration and call-to-action
- Staggered animation on new images

**Step 7: Redesign ImageModal**

Features:
- Fullscreen overlay with backdrop blur
- Large image display with zoom capability
- Sidebar panel with:
  - Prompt used
  - Aspect ratio
  - Timestamp
  - Action buttons (Download, Use as Reference, Delete)
- Navigation arrows (prev/next)
- Keyboard navigation (arrow keys, escape)
- Close button with X icon
- Smooth scale-in animation

**Step 8: Test thumbnail editor**

Navigate: `/thumbnails`
Check:
- All components render with premium styling
- Generation flow works
- Drag-and-drop references work
- Modal opens/closes smoothly
- Both themes look great

**Step 9: Commit**

```bash
git add src/app/thumbnails/page.tsx src/components/thumbnail-generator/
git commit -m "feat(ui): premium thumbnail editor with glassmorphism design"
```

---

## Phase 6: Settings & Templates

### Task 6.1: Settings Page

**Files:**
- Replace: `src/app/settings/page.tsx`

**Step 1: Build settings page**

Sections:
- API Keys (ElevenLabs, with masked display and edit)
- YouTube Connection (OAuth status, connect/disconnect)
- Default Settings (voice, thumbnail style, etc.)
- Appearance (theme selector with preview)
- Danger Zone (delete account)

Form styling:
- Card sections with headers
- Input fields with labels
- Toggle switches
- Save buttons per section

**Step 2: Test settings**

Navigate: `/settings`
Check: All sections render, forms are usable

**Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat(ui): settings page with API keys and preferences"
```

---

### Task 5.2: Templates Page

**Files:**
- Replace: `src/app/templates/page.tsx`

**Step 1: Build templates gallery**

Features:
- Header: Page title, search, filter buttons
- Grid of template cards
- Each card: Preview image, name, description, archetype badge, use button
- Hover effect with slight zoom on preview
- Categories: All, Listicles, Comparisons, Tutorials, News

Template card design:
- 16:9 preview area with gradient placeholder
- Title and description below
- Tags/badges
- "Use Template" button on hover

**Step 2: Test templates**

Navigate: `/templates`
Check: Grid displays, hover effects work

**Step 3: Commit**

```bash
git add src/app/templates/page.tsx
git commit -m "feat(ui): templates gallery with card grid"
```

---

## Phase 7: Polish & Verification

### Task 7.1: Cross-Theme Testing

**Step 1: Test dark mode**

Navigate: All pages
Check:
- Colors are vibrant but not harsh
- Text is readable
- Glows are visible but subtle
- YouTube watermark is visible
- No accessibility issues

**Step 2: Test light mode**

Toggle: Theme to light
Check:
- Colors are warm, not washed out
- Shadows provide depth
- Text has good contrast
- YouTube watermark has different treatment
- Feels premium, not "inverted dark mode"

**Step 3: Fix any issues**

---

### Task 7.2: Animation Polish

**Step 1: Verify all micro-interactions**

Check:
- Button hovers have lift/glow
- Cards have hover states
- Nav items animate on active
- Page transitions are smooth
- Modals open/close smoothly
- Pipeline edges animate
- Running nodes breathe
- Watermark particles move

**Step 2: Verify orchestrated reveals**

Navigate: Each page fresh
Check: Elements animate in sequence, not all at once

**Step 3: Performance check**

Run: `pnpm build`
Check: No build errors, animations are smooth at 60fps

---

### Task 7.3: Final Commit

```bash
git add -A
git commit -m "feat(ui): complete VidFlow premium UI/UX implementation"
```

---

## File Structure Summary

```
src/
├── app/
│   ├── globals.css              # Design system, themes, animations
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Dashboard
│   ├── pipelines/
│   │   └── page.tsx             # Pipeline editor
│   ├── runs/
│   │   └── page.tsx             # Run view
│   ├── thumbnails/
│   │   └── page.tsx             # Thumbnail studio
│   ├── settings/
│   │   └── page.tsx             # Settings
│   └── templates/
│       └── page.tsx             # Templates gallery
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── Header.tsx           # Page header
│   ├── pipeline/
│   │   ├── PipelineNode.tsx     # Custom React Flow node
│   │   ├── AnimatedEdge.tsx     # Flowing edge component
│   │   └── YouTubeWatermark.tsx # Creative background element
│   ├── run/
│   │   ├── NodeTimeline.tsx     # Vertical node progress
│   │   ├── LogPanel.tsx         # Real-time logs
│   │   └── InterventionModal.tsx # Review/approve modal
│   ├── thumbnail-generator/
│   │   ├── PromptInput.tsx      # Glassmorphism prompt textarea
│   │   ├── AspectRatioSelector.tsx # Pill-style ratio selector
│   │   ├── GenerateButton.tsx   # Animated generate button
│   │   ├── YouTubeExtractor.tsx # URL input and thumbnail extraction
│   │   ├── ImageGrid.tsx        # Masonry image grid with hover states
│   │   └── ImageModal.tsx       # Fullscreen image viewer
│   └── providers/
│       └── ThemeProvider.tsx    # next-themes wrapper
└── lib/
    └── utils.ts                 # cn() and helpers
```

---

## Quality Checklist

Before considering complete:

- [ ] Both themes look intentionally designed (not one is "inverted" version)
- [ ] YouTube watermark is creative and memorable in both themes
- [ ] Animations feel premium, not cheap or distracting
- [ ] Typography is distinctive (not Inter/Roboto)
- [ ] Node colors are consistent and recognizable
- [ ] Every hover/click has satisfying feedback
- [ ] Page loads feel orchestrated
- [ ] Pipeline editor is fully functional
- [ ] Run view intervention modal works
- [ ] Thumbnail editor feels like a premium creative tool
- [ ] Image generation flow is smooth with proper loading states
- [ ] No hydration errors
- [ ] Build succeeds without errors
- [ ] Would pay $99/month to use this tool
