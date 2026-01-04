# VidFlow: Modular YouTube Automation Platform

## Product Requirements Document

---

## 1. Vision Statement

VidFlow is a modular YouTube video production pipeline that allows creators to automate any part of their workflow — from finding topics to publishing videos. Unlike monolithic "AI video generators," VidFlow lets users connect discrete nodes (trigger → script → voice → thumbnail → assembly → publish) and configure each to their specific needs.

The core principle: **Full automation is possible, but every node can be customized, skipped, or manually overridden.**

---

## 2. User Personas

### Persona A: Solo Faceless Creator — "Alex"

**Background:**
- Runs 2 faceless YouTube channels (tech explainers, finance news)
- Technical enough to use APIs but doesn't want to code
- Time-poor, wants maximum automation
- Cares about quality — won't publish garbage

**Goals:**
- Find trending topics before competitors
- Generate scripts that match channel voice
- Produce 3-5 videos per week with minimal manual work
- Maintain consistent brand across videos

**Pain Points:**
- Current workflow is manual and slow (8+ hours per video)
- Tried other AI tools but output was generic/unusable
- Struggles to maintain consistent tone across scripts
- Thumbnail creation is tedious and inconsistent

**Usage Pattern:**
- Wants end-to-end automation for routine content
- Will manually review/edit scripts for important videos
- Needs to customize voice, thumbnails, and style per channel

---

### Persona B: Content Agency — "Maria"

**Background:**
- Manages YouTube content for 8 clients
- Team of 3 editors and 1 strategist
- Each client has different brand voice, audience, and requirements
- Needs to produce 30+ videos per month across all clients

**Goals:**
- Standardize production workflow across team
- Maintain distinct brand identity per client
- Reduce time from concept to publish
- Scale without hiring more staff

**Pain Points:**
- Each client requires different prompts, styles, voices
- Team members have inconsistent quality
- No central system — everything in spreadsheets and Slack
- Onboarding new clients takes weeks of setup

**Usage Pattern:**
- Needs project-based organization (one project per client)
- Wants templates that enforce client brand guidelines
- Team members should only see their assigned projects
- Approval workflows before publishing

---

### Persona C: Experimenter — "Jake"

**Background:**
- Starting first YouTube channel
- Testing different niches to find what works
- Limited budget, learning as he goes
- Willing to do manual work but wants to learn automation

**Goals:**
- Quickly test if a niche has potential
- Produce MVPs fast to validate ideas
- Learn what works before investing in quality
- Eventually automate what proves successful

**Pain Points:**
- Doesn't know what niche to pursue
- Analysis paralysis — too many options
- Can't afford to spend weeks on videos that flop
- Doesn't have brand guidelines yet (still figuring it out)

**Usage Pattern:**
- Starts with NicheRadar integration to find opportunities
- Uses basic templates, not custom brand guidelines
- Runs partial workflows (generate script, then manually record)
- Gradually enables more automation as channel grows

---

## 3. Core User Journeys

### Journey 1: First-Time Setup

**As Alex (Solo Creator), I want to set up my first automated channel so that I can start producing videos.**

**Steps:**

1. **Create Account**
   - Sign up with email or Google
   - Select plan tier (affects video limits)

2. **Create First Project**
   - Name: "TechExplained"
   - Type: YouTube Channel
   - Niche: Technology/Software

3. **Configure Project Defaults**
   
   **Channel Identity:**
   ```
   Channel Name: TechExplained
   Target Audience: Developers and tech enthusiasts, 25-40, intermediate knowledge
   Tone: Professional but conversational, occasional dry humor
   Vocabulary: Technical terms OK, explain jargon briefly
   Video Style: Faceless explainer with screen recordings and motion graphics
   Typical Length: 8-12 minutes
   ```
   
   **Brand Guidelines:**
   ```
   Colors: Primary #2563EB (blue), Secondary #1E293B (dark slate)
   Fonts: Inter for titles, system font for body
   Thumbnail Style: Dark background, bold text, relevant icon/screenshot
   Intro: 3-second logo animation (upload file)
   Outro: 10-second subscribe CTA (upload file)
   ```
   
   **Content Rules:**
   ```
   Always include: Code examples where relevant, practical takeaways
   Never include: Clickbait claims, unverified information, competitor bashing
   Call to action: "Check the links in description" (not "smash subscribe")
   ```

4. **Connect API Credentials**
   - ElevenLabs: API key + select voice ID
   - YouTube: OAuth connection
   - (Optional) NicheRadar: Connect for topic suggestions

5. **Test Pipeline**
   - System generates a 30-second test video using their settings
   - User reviews and adjusts if needed

**Acceptance Criteria:**
- [ ] User can complete setup in under 15 minutes
- [ ] All project defaults are saved and applied to future runs
- [ ] Test video reflects configured brand guidelines
- [ ] User can edit any setting after initial setup

---

### Journey 2: Automated Video Production (Full Pipeline)

**As Alex, I want to produce a video from topic to publish with minimal intervention.**

**Preconditions:**
- Project configured with all defaults
- API credentials connected
- At least one successful test run

**Steps:**

1. **Trigger: New Topic Selected**
   
   Option A: Manual trigger
   - User enters topic: "Cursor AI vs GitHub Copilot"
   - User selects archetype: "VS Battle"
   
   Option B: NicheRadar trigger
   - System detects opportunity: gap score 52, authority gap, cross-platform
   - User approves topic for production
   - Archetype auto-suggested based on topic type

2. **Node 1: Research & Context Gathering**
   
   System automatically:
   - Fetches recent articles/posts about topic
   - Extracts key facts, features, comparisons
   - Identifies common questions people ask
   - Compiles into structured research document
   
   Output:
   ```json
   {
     "topic": "Cursor AI vs GitHub Copilot",
     "archetype": "vs_battle",
     "research": {
       "product_a": { "name": "Cursor AI", "features": [...], "pricing": [...] },
       "product_b": { "name": "GitHub Copilot", "features": [...], "pricing": [...] },
       "key_differences": [...],
       "common_questions": [...],
       "recent_developments": [...]
     },
     "sources": [...]
   }
   ```

3. **Node 2: Script Generation**
   
   System receives:
   - Research document (from previous node)
   - Archetype template (VS Battle structure)
   - Project context (channel bible, tone, audience)
   - Run overrides (if any)
   
   System generates:
   ```
   TITLE: Cursor AI vs GitHub Copilot: I Used Both for 30 Days
   
   HOOK (0:00-0:30):
   [SCRIPT]: "I've been mass swapping between these two AI coding assistants 
   for the last month. One of them mass surprised me. Here's everything you 
   need to know before mass choosing."
   
   INTRO (0:30-1:00):
   [SCRIPT]: "Both Cursor and Copilot promise to 10x your coding speed..."
   [B-ROLL]: Side-by-side interface comparison
   
   SECTION 1 - CODE COMPLETION (1:00-3:00):
   [SCRIPT]: "Let's start with the core feature..."
   [SCREEN RECORDING]: Demo of both tools completing same code
   [VERDICT CARD]: "Code Completion: Cursor wins"
   
   ... (continues with full script)
   
   OUTRO (11:00-12:00):
   [SCRIPT]: "So which one should you use? If you're..."
   [CTA]: "Links to both in the description."
   ```
   
   **User Intervention Point:**
   - Script displayed for review
   - User can: Approve / Edit / Regenerate / Regenerate section
   - If "Auto-approve" enabled in project settings, skips to next node

4. **Node 3: Voice Generation**
   
   System receives:
   - Approved script (voice sections extracted)
   - Project voice settings (ElevenLabs voice ID, speed, stability)
   
   System generates:
   - Audio file for each script section
   - Timestamps aligned to script markers
   
   Output:
   ```json
   {
     "audio_segments": [
       { "id": "hook", "file": "audio/hook.mp3", "duration": 28.4 },
       { "id": "intro", "file": "audio/intro.mp3", "duration": 31.2 },
       ...
     ],
     "total_duration": 724.6
   }
   ```
   
   **User Intervention Point:**
   - Audio preview available
   - User can: Approve / Regenerate segment / Upload own audio for segment

5. **Node 4: Thumbnail Generation**
   
   System receives:
   - Video title
   - Topic/archetype context
   - Project thumbnail guidelines
   
   System generates:
   - 3 thumbnail options
   - CTR prediction score for each
   
   **User Intervention Point:**
   - User selects preferred thumbnail
   - Can request variations or upload custom

6. **Node 5: Video Assembly**
   
   System receives:
   - Script with visual markers
   - Audio segments
   - Project assets (intro, outro, fonts, colors)
   
   System generates:
   - Assembled video file
   - Subtitle file (.srt)
   
   **User Intervention Point:**
   - Video preview available
   - User can: Approve / Flag issues / Download for manual editing

7. **Node 6: Publish**
   
   System receives:
   - Video file
   - Thumbnail
   - Metadata template
   
   System generates:
   - Title (from script)
   - Description (templated with links)
   - Tags (auto-generated + project defaults)
   - Publish time (scheduled or immediate)
   
   **User Intervention Point:**
   - Final review of metadata
   - User can: Publish now / Schedule / Save as draft / Download package

**Acceptance Criteria:**
- [ ] Full pipeline completes in under 30 minutes (excluding user review time)
- [ ] User can pause at any node for manual review
- [ ] User can skip any node (e.g., upload own audio, skip thumbnail)
- [ ] Project context is applied consistently across all nodes
- [ ] User can re-run any node without restarting entire pipeline

---

### Journey 3: Partial Automation (Script Only)

**As Jake (Experimenter), I want to generate just a script so I can record it myself.**

**Steps:**

1. **Create Minimal Project**
   - Name: "TestChannel"
   - Skip most configuration (use system defaults)
   - Only configure: Target audience, basic tone

2. **Start New Video**
   - Enter topic manually: "Best free AI tools 2025"
   - Select archetype: "Listicle/Ranking"

3. **Generate Script**
   - System uses minimal context + archetype template
   - Generates full script with structure

4. **Export Script**
   - Download as Google Doc / Notion / Plain text
   - Pipeline ends here — no further automation

**Acceptance Criteria:**
- [ ] User can run single node without configuring entire pipeline
- [ ] Minimal setup required for basic functionality
- [ ] Output exportable in common formats

---

### Journey 4: Multi-Client Management (Agency)

**As Maria (Agency), I want to manage multiple client channels with distinct configurations.**

**Steps:**

1. **Create Workspace**
   - Workspace: "Maria's Agency"
   - Invite team members with roles (Admin, Editor, Viewer)

2. **Create Client Projects**
   
   Project: "Client A - Fitness Channel"
   ```
   Brand Voice: Energetic, motivational, uses fitness jargon
   Audience: Gym enthusiasts, 18-35
   Thumbnail Style: Bright colors, transformation photos, bold text
   Voice: ElevenLabs "Josh" (energetic male)
   ```
   
   Project: "Client B - Finance Education"
   ```
   Brand Voice: Calm, authoritative, explains complex topics simply
   Audience: Young professionals, 25-40
   Thumbnail Style: Clean, minimal, trust-inducing blue tones
   Voice: ElevenLabs "Rachel" (professional female)
   ```

3. **Assign Team Members**
   - Editor 1 → Client A only
   - Editor 2 → Client B only
   - Maria → All projects

4. **Run Productions**
   - Each project uses its own configuration
   - Team members only see assigned projects
   - All work tracked in central dashboard

5. **Approval Workflow**
   - Editors submit completed videos for review
   - Maria approves before publish
   - Client can have view-only access for approval

**Acceptance Criteria:**
- [ ] Complete isolation between client projects
- [ ] Team permissions enforced at project level
- [ ] Approval workflow configurable per project
- [ ] Usage tracking per project (for client billing)

---

### Journey 5: Template Creation & Reuse

**As Alex, I want to create a reusable template for my weekly news videos.**

**Steps:**

1. **Create Template from Successful Video**
   - Select completed video that performed well
   - "Save as Template"

2. **Configure Template**
   ```
   Template Name: "Weekly Tech News"
   
   Structure:
   - Hook: Tease top 3 stories
   - Intro: Standard channel intro
   - Story 1: [VARIABLE] - 2-3 minutes
   - Story 2: [VARIABLE] - 2-3 minutes  
   - Story 3: [VARIABLE] - 2-3 minutes
   - Outro: Standard CTA
   
   Fixed Elements:
   - Intro animation: [uploaded file]
   - Transition style: Swipe left
   - Background music: [uploaded file]
   - Outro animation: [uploaded file]
   
   Variable Elements:
   - Story topics: [input required each run]
   - Story scripts: [generated per run]
   - Story visuals: [generated per run]
   ```

3. **Use Template**
   - Start new video → Select template "Weekly Tech News"
   - Input this week's stories
   - System generates script following template structure
   - Fixed elements automatically inserted

**Acceptance Criteria:**
- [ ] Templates capture both structure and assets
- [ ] Variable sections clearly marked for input
- [ ] Templates shareable across projects (with permission)
- [ ] System suggests templates based on archetype selection

---

## 4. Configuration Hierarchy

Configuration cascades from general to specific, with more specific levels overriding general:

```
┌─────────────────────────────────────────┐
│ SYSTEM DEFAULTS                         │
│ (Hardcoded sensible defaults)           │
│ • Default model: claude-sonnet-4-20250514       │
│ • Default voice speed: 1.0              │
│ • Default video resolution: 1080p       │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ USER DEFAULTS                           │
│ (Apply to all user's projects)          │
│ • Preferred LLM provider                │
│ • API keys                              │
│ • Default language                      │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ PROJECT DEFAULTS                        │
│ (Apply to all videos in project)        │
│ • Channel bible                         │
│ • Brand guidelines                      │
│ • Voice ID                              │
│ • Thumbnail style                       │
│ • Default archetype                     │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ TEMPLATE DEFAULTS                       │
│ (Apply when template selected)          │
│ • Fixed structure                       │
│ • Fixed assets                          │
│ • Prompt modifications                  │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ RUN OVERRIDES                           │
│ (Apply to this execution only)          │
│ • "Make this more casual"               │
│ • "Skip thumbnail generation"           │
│ • "Use different voice for this one"    │
└─────────────────────────────────────────┘
```

**Resolution Example:**

User runs script generation for "Cursor vs Copilot" video:

1. System default: Use Claude Sonnet
2. User default: (not set, use system)
3. Project default: Tone = "Professional but conversational", Audience = "Developers 25-40"
4. Template default: (not using template)
5. Run override: "Make this one more opinionated, take a clear stance"

Final prompt includes: Claude Sonnet + Project tone + Project audience + Run override for opinionated stance

---

## 5. Node Specifications

### 5.1 Script Generator Node

**The most complex node — requires rich context to produce usable output.**

**Inputs:**

| Input | Required | Source | Description |
|-------|----------|--------|-------------|
| topic | Yes | User or previous node | What the video is about |
| archetype | Yes | User selection | Structural template (VS Battle, Fortune File, etc.) |
| research | No | Research node or user | Facts, sources, key points |
| channel_bible | No | Project config | Tone, audience, vocabulary rules |
| examples | No | Project config | Few-shot examples of good scripts |
| constraints | No | Project or run config | Length, format, required sections |
| run_instructions | No | User at runtime | Specific instructions for this run |

**Channel Bible Structure:**

```typescript
interface ChannelBible {
  // Identity
  channel_name: string;
  tagline?: string;
  
  // Audience
  target_audience: {
    demographics: string;      // "Developers, 25-40, intermediate skill"
    knowledge_level: string;   // "Assume basic programming knowledge"
    why_they_watch: string;    // "To learn new tools and stay current"
  };
  
  // Voice
  tone: {
    overall: string;           // "Professional but conversational"
    humor: string;             // "Occasional dry humor, never silly"
    formality: string;         // "Casual but credible"
  };
  
  // Language
  vocabulary: {
    use_jargon: boolean;       // true - audience knows terms
    explain_threshold: string; // "Explain anything introduced after 2023"
    banned_words: string[];    // ["amazing", "insane", "game-changer"]
    preferred_phrases: string[]; // ["Here's the thing", "Let's break this down"]
  };
  
  // Structure preferences
  structure: {
    typical_length: string;    // "8-12 minutes"
    hook_style: string;        // "Start with bold claim or question"
    cta_style: string;         // "Soft CTA, mention description links"
    intro_length: string;      // "Under 30 seconds, no channel intro"
  };
  
  // Content rules
  rules: {
    always_include: string[];  // ["Practical examples", "Honest pros/cons"]
    never_include: string[];   // ["Unverified claims", "Sponsor without disclosure"]
    fact_check: string;        // "All statistics must have source"
  };
  
  // Examples
  example_scripts?: {
    name: string;
    script: string;
    notes: string;             // "Good example of our comparison style"
  }[];
}
```

**Output:**

```typescript
interface ScriptOutput {
  title: string;
  hook: {
    text: string;
    duration_estimate: number;
    visual_notes: string;
  };
  sections: {
    name: string;
    script: string;
    duration_estimate: number;
    visual_notes: string;
    b_roll_suggestions: string[];
  }[];
  outro: {
    text: string;
    cta: string;
  };
  metadata: {
    description_draft: string;
    tags: string[];
    chapters: { timestamp: string; title: string }[];
  };
  total_duration_estimate: number;
}
```

---

### 5.2 Voice Generator Node

**Inputs:**

| Input | Required | Source | Description |
|-------|----------|--------|-------------|
| script_segments | Yes | Script node | Text to convert to speech |
| voice_config | Yes | Project config | Provider, voice ID, settings |
| pronunciation_guide | No | Project config | Custom pronunciations |

**Voice Config Structure:**

```typescript
interface VoiceConfig {
  provider: 'elevenlabs' | 'playht' | 'openai';
  voice_id: string;
  settings: {
    speed: number;           // 0.5 - 2.0
    stability: number;       // 0 - 1 (ElevenLabs)
    similarity_boost: number; // 0 - 1 (ElevenLabs)
  };
  pronunciation_overrides: {
    word: string;
    phonetic: string;
  }[];
}
```

---

### 5.3 Thumbnail Generator Node

**Inputs:**

| Input | Required | Source | Description |
|-------|----------|--------|-------------|
| title | Yes | Script node | Video title for text extraction |
| topic_context | Yes | Previous nodes | What the video is about |
| style_guide | Yes | Project config | Brand colors, fonts, style |
| reference_images | No | Project config or user | Examples of good thumbnails |

**Style Guide Structure:**

```typescript
interface ThumbnailStyleGuide {
  dimensions: { width: number; height: number };
  
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  
  typography: {
    font_family: string;
    max_words: number;        // Usually 3-5
    text_position: 'left' | 'right' | 'center' | 'dynamic';
  };
  
  style: {
    background_type: 'generated' | 'solid' | 'gradient' | 'image';
    include_face: boolean;
    face_expression?: string; // "surprised", "curious", etc.
    overall_mood: string;     // "professional", "energetic", "dark"
  };
  
  elements: {
    use_arrows: boolean;
    use_circles: boolean;
    use_icons: boolean;
    logo_position?: 'corner' | 'none';
  };
}
```

---

### 5.4 Video Assembly Node

**Inputs:**

| Input | Required | Source | Description |
|-------|----------|--------|-------------|
| script | Yes | Script node | Structure and visual notes |
| audio_segments | Yes | Voice node | Generated audio files |
| assets | Yes | Project config | Intro, outro, music, fonts |
| visual_config | Yes | Project config | Resolution, style settings |

**Assembly Config Structure:**

```typescript
interface AssemblyConfig {
  resolution: '1080p' | '4k';
  aspect_ratio: '16:9' | '9:16' | '1:1';
  frame_rate: 30 | 60;
  
  assets: {
    intro_video?: string;     // File path or URL
    outro_video?: string;
    background_music?: string;
    watermark?: string;
  };
  
  style: {
    transition_type: 'cut' | 'fade' | 'swipe';
    text_animation: 'none' | 'fade' | 'typewriter';
    caption_style: {
      enabled: boolean;
      font: string;
      position: 'bottom' | 'center';
      style: 'standard' | 'word_highlight';
    };
  };
  
  b_roll: {
    source: 'generated' | 'stock' | 'screen_recording' | 'manual';
    stock_provider?: 'pexels' | 'storyblocks';
  };
}
```

---

### 5.5 Publish Node

**Inputs:**

| Input | Required | Source | Description |
|-------|----------|--------|-------------|
| video_file | Yes | Assembly node | Final video |
| thumbnail | Yes | Thumbnail node | Thumbnail image |
| metadata | Yes | Script node + config | Title, description, tags |
| publish_config | Yes | Project config | Channel, schedule, visibility |

**Publish Config Structure:**

```typescript
interface PublishConfig {
  platform: 'youtube';  // Extensible for future platforms
  channel_id: string;
  
  defaults: {
    visibility: 'public' | 'unlisted' | 'private';
    category: string;
    language: string;
    made_for_kids: boolean;
  };
  
  scheduling: {
    mode: 'immediate' | 'scheduled' | 'draft';
    preferred_times?: string[];  // ["Tuesday 10:00", "Thursday 10:00"]
  };
  
  metadata_template: {
    description_template: string;  // With {{variables}}
    default_tags: string[];
    end_screen_template?: string;
    cards_template?: string;
  };
}
```

---

## 6. Data Flow Between Nodes

Each node produces output that subsequent nodes can consume:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Research   │────▶│   Script    │────▶│    Voice    │
│    Node     │     │    Node     │     │    Node     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │ research_doc      │ script_output      │ audio_segments
      ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────┐
│                  RUN CONTEXT                         │
│                                                     │
│  {                                                  │
│    run_id: "abc123",                               │
│    project_id: "proj_456",                         │
│    topic: "Cursor vs Copilot",                     │
│    archetype: "vs_battle",                         │
│    research: { ... },        // From Research Node │
│    script: { ... },          // From Script Node   │
│    audio: { ... },           // From Voice Node    │
│    thumbnail: { ... },       // From Thumb Node    │
│    video: { ... },           // From Assembly Node │
│    status: "voice_complete",                       │
│    user_overrides: { ... }                         │
│  }                                                 │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Thumbnail  │     │  Assembly   │────▶│   Publish   │
│    Node     │     │    Node     │     │    Node     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Run Context:**
- Created when pipeline starts
- Accumulates output from each node
- Persisted to database (allows resume after pause)
- Contains full audit trail

---

## 7. User Intervention Points

At each node, user can:

| Action | Description |
|--------|-------------|
| **Auto-proceed** | Output accepted, continue to next node |
| **Review & Approve** | View output, manually approve to continue |
| **Edit** | Modify output before continuing |
| **Regenerate** | Re-run node with same inputs |
| **Regenerate with feedback** | Re-run with additional instructions |
| **Skip** | Skip this node, provide own input for next node |
| **Pause** | Save state, continue later |
| **Abort** | Cancel run, discard outputs |

**Configurable per project:**

```typescript
interface InterventionConfig {
  script_generation: 'auto' | 'review' | 'always_review';
  voice_generation: 'auto' | 'review';
  thumbnail_generation: 'review';  // Usually want to pick from options
  video_assembly: 'auto' | 'review';
  publish: 'review' | 'always_review';  // Never auto-publish by default
}
```

---

## 8. Success Metrics

### For Users:

| Metric | Target | How Measured |
|--------|--------|--------------|
| Time from topic to publish | <2 hours (automated) | Timestamp tracking |
| Script acceptance rate | >70% first generation | Regeneration tracking |
| Thumbnail selection | <3 options needed | Generation count |
| Videos published per week | 3x baseline | Before/after comparison |

### For Product:

| Metric | Target | How Measured |
|--------|--------|--------------|
| Setup completion rate | >80% | Funnel tracking |
| First video published | <24 hours from signup | Time tracking |
| Weekly active pipelines | >3 per user | Run counts |
| Node skip rate | <20% | Skip tracking |
| Churn rate | <5% monthly | Subscription tracking |

---

## 9. Technical Constraints

### Must Have:

- [ ] All API keys stored encrypted
- [ ] Pipeline state persisted (resume after browser close)
- [ ] Outputs saved to user's cloud storage (not our servers long-term)
- [ ] Rate limiting per user (prevent abuse)
- [ ] Graceful failure handling (one node fails, don't lose previous work)

### Should Have:

- [ ] Concurrent node execution where possible (thumbnail + voice in parallel)
- [ ] Cost estimation before run starts
- [ ] Usage dashboard per project
- [ ] Export pipeline configuration (backup/share)

### Nice to Have:

- [ ] Visual workflow builder (drag-and-drop nodes)
- [ ] Custom node creation (power users)
- [ ] A/B testing for thumbnails
- [ ] Analytics integration (track video performance)

---

## 10. Out of Scope (V1)

- Multi-platform publishing (TikTok, Shorts) — YouTube only for V1
- Live streaming automation
- Comment response automation  
- Custom AI model fine-tuning
- White-label / reseller features
- Mobile app

---

## Appendix A: Example Channel Bible

```json
{
  "channel_name": "CodeCraft",
  "tagline": "Level up your development skills",
  
  "target_audience": {
    "demographics": "Software developers, 25-40, employed, intermediate to senior level",
    "knowledge_level": "Assume 2+ years programming experience. Familiar with Git, basic cloud concepts, at least one backend language.",
    "why_they_watch": "Stay current with new tools without reading 10 blog posts. Get honest assessments, not hype."
  },
  
  "tone": {
    "overall": "Knowledgeable peer, not lecturer. Like explaining to a smart colleague over coffee.",
    "humor": "Dry observations about developer life. Self-deprecating about own past mistakes. Never mean-spirited.",
    "formality": "Professional but relaxed. Contractions OK. Occasional mild frustration ('Look, this API is just badly designed') is authentic."
  },
  
  "vocabulary": {
    "use_jargon": true,
    "explain_threshold": "Explain any tool or concept released after January 2024. Assume viewer knows Docker, REST, basic SQL.",
    "banned_words": ["amazing", "incredible", "game-changer", "revolutionize", "you won't believe", "hack"],
    "preferred_phrases": ["Here's the thing", "In practice", "What this actually means", "The honest answer is", "Let me show you"]
  },
  
  "structure": {
    "typical_length": "8-15 minutes. Can go longer for complex topics, but only if every minute adds value.",
    "hook_style": "Start with the core value or surprising finding. No 'Hey guys welcome back'. Get to the point in first 10 seconds.",
    "cta_style": "Mention description links naturally when relevant. End with genuine recommendation, not begging for subscribes.",
    "intro_length": "No channel intro. Cold open into content. Logo in corner is enough."
  },
  
  "rules": {
    "always_include": [
      "Show real code or real interface, not just slides",
      "Acknowledge limitations and tradeoffs",
      "Give specific recommendation at the end",
      "Include timestamps in description"
    ],
    "never_include": [
      "Fake enthusiasm",
      "Unverified performance claims",
      "Trashing competitors unfairly",
      "Sponsored content without disclosure"
    ],
    "fact_check": "All benchmarks must be reproducible. Link to methodology or source."
  }
}
```

---

*Document Version: 1.0*  
*Last Updated: January 2026*
