# VidFlow UI/UX Vision

## Read First

**Before implementing, read the frontend-design skill:**
```
/mnt/skills/public/frontend-design/SKILL.md
```

Use this skill to create distinctive, production-grade interfaces. Be creative with animations, micro-interactions, and visual polish.

---

## The Vision

VidFlow should feel like a **premium creative tool** — think Figma meets Linear meets YouTube Studio. It's a tool for creators, so it needs to feel inspiring, not utilitarian.

### Core Principles

1. **Beautiful in both modes** — Light and dark themes should both be stunning, not just "inverted colors"
2. **Fluid & alive** — Purposeful animations everywhere. Nothing should feel static or jarring
3. **YouTube-native** — Subtle nods to YouTube's brand without being a clone
4. **Creator-focused** — Feels like a tool for artists, not spreadsheets

---

## Key Design Elements

### YouTube Watermark in Pipeline Canvas

The pipeline editor (React Flow area) should have a **subtle, stylized YouTube play button logo as a watermark/background element**. Ideas:
- Very low opacity (2-5%)
- Could be oversized and cropped
- Could be a geometric/abstract interpretation
- Should feel integrated, not slapped on
- Different treatment for light vs dark mode

This gives the canvas identity and reinforces what the tool is for.

### Node Design

Each pipeline node type should have its own **color identity**:
- Trigger — distinct color
- Script — distinct color  
- Voice — distinct color
- Thumbnail — distinct color
- Assembly — distinct color
- Publish — YouTube red (the destination)

Nodes should feel like **tangible objects**:
- Subtle shadows/elevation
- Smooth hover states
- Satisfying click feedback
- Status indicators that animate (running spinner, success checkmark, etc.)

### Connections/Edges

The lines connecting nodes should feel **premium**:
- Animated flow (particles, dashes, or glow moving along the path)
- Different states: idle, running (animated), complete, error
- Smooth bezier curves
- Could pulse or glow when data is "flowing"

### Dark Mode

Dark mode should be **rich and cinematic**, not just gray:
- Deep blacks with subtle color tints
- Glowing accents
- Nodes should feel like they're floating
- Consider subtle gradients in backgrounds

### Light Mode

Light mode should be **clean and airy**, not sterile:
- Warm whites, not harsh
- Soft shadows
- Enough contrast to feel premium
- Should feel just as polished as dark mode

---

## Pages to Build

### 1. Dashboard (`/`)

The home page. Shows:
- Recent runs with status
- Quick stats (videos published, in progress)
- Quick actions (new run, continue draft)
- Maybe a "what's new" or tips section

Feel: Command center, at-a-glance overview

### 2. Pipeline Editor (`/pipelines/[id]` or `/editor`)

The main event. Visual node-based editor using React Flow.

Features:
- Drag and drop nodes from sidebar
- Connect nodes by dragging handles
- Click node to open config panel (slide-in from right)
- YouTube logo watermark in canvas background
- Minimap in corner
- Zoom controls
- Run button that triggers the pipeline

Feel: Creative canvas, powerful but approachable

### 3. Run View (`/runs/[id]`)

Watch a pipeline execute in real-time.

Features:
- Pipeline visualization with live status on each node
- Nodes light up/animate as they run
- Progress bars within nodes
- Expandable log panel
- Intervention modal when approval needed
- Output preview (script text, audio player, video player)

Feel: Mission control, watching something come to life

### 4. Settings (`/settings`)

Configuration hub.

Sections:
- **API Keys** — ElevenLabs, Gemini/OpenAI, Pexels
- **YouTube Connection** — OAuth connect, channel selector
- **Defaults** — Voice settings, thumbnail style, publish settings
- **Theme** — Light/dark toggle (or system)

Feel: Clean, organized, no clutter

### 5. Templates (`/templates`)

Pre-built pipeline configurations.

Features:
- Grid of template cards
- Preview of what nodes are included
- One-click to create new pipeline from template

Feel: Gallery, inspiration

---

## Component Highlights

### Intervention Modal

When a node needs approval (e.g., review script before generating voice):
- Full-screen or large modal
- Shows the output to review
- Edit inline if needed
- Approve / Request Changes / Skip buttons
- Should feel important, not annoying

### Node Config Panel

Slide-in panel when a node is selected:
- Node-specific settings
- Collapsible sections
- Live preview where possible
- Save button with loading state

### Run Progress

When pipeline is running:
- Each node shows: pending → running (with %) → complete/failed
- Animated transitions between states
- Time elapsed per node
- Total progress indicator

### Toast Notifications

For async feedback:
- Slide in from bottom or top-right
- Different styles for success/error/info
- Auto-dismiss with progress indicator
- Action buttons when relevant

---

## Animation Ideas

Be creative! Some suggestions to spark ideas:

- **Page transitions** — Smooth fades or slides between routes
- **Node entrance** — Nodes could scale/fade in when added
- **Connection drawing** — Animate the line being drawn when connecting
- **Running state** — Particles flowing along edges, pulsing nodes
- **Success celebration** — Subtle confetti or glow when pipeline completes
- **Hover states** — Lift/scale nodes slightly on hover
- **Button feedback** — Satisfying press animations
- **Loading states** — Skeleton screens, not spinners everywhere
- **Theme switch** — Smooth transition between light/dark

---

## Tech Stack

- **React Flow** — Pipeline editor (https://reactflow.dev)
- **Framer Motion** — Animations
- **Tailwind CSS** — Styling
- **Zustand** — State management (already in use)
- **Lucide React** — Icons
- **next-themes** — Theme switching

---

## Reference Inspiration

Look at these for inspiration (don't copy, be inspired):

- **Linear** — Clean, fast, great dark mode
- **Figma** — Canvas-based editing, node connections
- **Runway ML** — Creative AI tool aesthetic
- **Vercel Dashboard** — Modern, polished
- **Raycast** — Fluid animations, attention to detail
- **Arc Browser** — Playful but professional

---

## Summary

Build something you'd be proud to show off. The UI should make people say "this looks premium" at first glance. 

Be creative. Surprise me. Use the frontend-design skill. Make it beautiful.