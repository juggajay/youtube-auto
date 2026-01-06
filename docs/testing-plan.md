# VidFlow End-to-End Testing Plan

## Overview
Quick validation that all major features work correctly.

---

## 1. Navigation & Layout
- [ ] Dashboard loads at `/`
- [ ] Sidebar shows "Guest" / "Demo Mode"
- [ ] All nav links work: Dashboard, Pipeline Editor, Run View, Thumbnails, Settings, Templates

## 2. Dashboard (`/`)
- [ ] Stats cards display (Videos Published, Pipeline Runs, Success Rate, API Costs)
- [ ] "Recent Runs" section shows empty state or list
- [ ] "Create Pipeline" link navigates to `/pipelines`

## 3. Pipeline Editor (`/pipelines`)
- [ ] Page loads without errors
- [ ] Can create a new pipeline
- [ ] Can add nodes to pipeline (Script, Voice, Thumbnail, Assembly, Publish)
- [ ] Can configure node settings
- [ ] Can save pipeline
- [ ] Can delete pipeline

## 4. Run View (`/runs`)
- [ ] Page loads without errors
- [ ] Shows empty state if no runs
- [ ] Can start a new run from a pipeline
- [ ] Run progress updates in real-time
- [ ] Can view completed run details

## 5. Thumbnails (`/thumbnails`)
- [ ] Page loads without errors
- [ ] Can enter a prompt for thumbnail generation
- [ ] Can select aspect ratio (16:9, 9:16, 1:1)
- [ ] Generate button triggers API call
- [ ] Generated thumbnails display in grid
- [ ] Can click thumbnail to view full size
- [ ] Can download generated thumbnail

## 6. Settings (`/settings`)
- [ ] Page loads without errors
- [ ] Can enter/update API keys (ElevenLabs, YouTube)
- [ ] Settings persist after page refresh

## 7. Templates (`/templates`)
- [ ] Page loads without errors
- [ ] Template list displays
- [ ] Can select a template
- [ ] Can use template to create pipeline

---

## 8. Node-Specific Tests

### Script Node
- [ ] Can configure prompt/topic
- [ ] Can select archetype
- [ ] Script generation returns valid output

### Voice Node
- [ ] Can select voice
- [ ] Can configure settings (stability, clarity)
- [ ] Audio generation works (requires ElevenLabs API key)

### Thumbnail Node
- [ ] Can enter custom prompt
- [ ] Multiple generators available
- [ ] Image generation returns valid output

### Assembly Node
- [ ] Can configure video settings
- [ ] FFmpeg processing works
- [ ] Output video is valid

### Publish Node
- [ ] YouTube OAuth flow works (requires setup)
- [ ] Can set title, description, tags
- [ ] Upload to YouTube succeeds

---

## 9. Error Handling
- [ ] Invalid API keys show clear error message
- [ ] Network errors display user-friendly message
- [ ] Form validation works on all inputs

## 10. Responsive Design
- [ ] App works on desktop (1920px)
- [ ] App works on tablet (768px)
- [ ] App works on mobile (375px)

---

## Quick Smoke Test (5 min)
1. Open https://vidflow-green-seven.vercel.app/
2. Verify dashboard loads with "Guest" mode
3. Click through all nav links
4. Go to Thumbnails, enter a prompt, click Generate
5. Verify thumbnail appears or error message displays

## Notes
- Some features require API keys to fully test
- YouTube publishing requires OAuth setup in Google Cloud Console
- ElevenLabs voice generation requires paid API key
