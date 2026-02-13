# BSF Lecture Assistant - Project Summary

## Overview
Agentic web application for Indonesian adult men to generate BSF (Bible Study Fellowship) lecture materials. 4-phase workflow: Upload → Strategy → Narrative → Lecture → Visuals.

## Tech Stack
- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **UI Components**: Radix UI + Tailwind CSS
- **AI**: Anthropic Claude Sonnet 4.5 (configured via env vars)
- **PDF Processing**: pdfjs-dist

## Working Directory
```
/Users/adhigaduh/projects/learnvibe/my-app78
```

## Key Commands
```bash
npm run dev    # Start dev server (port 3000)
npm run build  # Production build
npm run lint   # Run ESLint
```

## Project Structure

### Core Files
- `app/page.tsx` - Main application page with phase navigation
- `lib/workflow-store.ts` - Zustand store with phase data and persistence
- `types/workflow.ts` - TypeScript type definitions

### Workflow Phases (Components)
1. `components/FileUploader.tsx` - Upload PDF/DOCX/txt
2. `components/Phase1StrategicFoundation.tsx` - Generate Aim & Divisional Principles
3. `components/Phase2NarrativeArc.tsx` - Generate Bookend Story options
4. `components/Phase3LectureGeneration.tsx` - Generate full lecture manuscript (~3500 words)
5. `components/Phase4VisualAssets.tsx` - Generate AI image prompts for slides

### Supporting Components
- `components/WorkflowStatus.tsx` - Progress bar + "Resume Your Work" card
- `components/ProgressBar.tsx` - Phase navigation progress indicator
- `components/SettingsPanel.tsx` - Language toggle (EN/ID), AI model selection

### API Routes
- `app/api/generate/phase1/route.ts` - Strategy generation
- `app/api/generate/phase2/route.ts` - Narrative generation
- `app/api/generate/phase3/route.ts` - Lecture generation
- `app/api/generate/phase4/route.ts` - Visual assets generation
- `app/api/upload/route.ts` - File upload & text extraction

### Configuration
- `config/config.yaml` - AI models, language instructions
- `lib/config.server.ts` - Config loading with env var substitution (e.g., `${ANTHROPIC_API_KEY}`)

## Recent Fixes (Feb 13, 2026)

### Phase Navigation Bug
Fixed `canProceedToPhase()` in `workflow-store.ts`:
- Phase 2 checks `phase1.selected` (was incorrectly checking `phase2.selected`)
- Extended `WorkflowPhase` type to include `5`

### Timers Implementation
All phases now show:
- Live timer during generation ("Analyzing Text...", "Generating Stories...", etc.)
- Permanent "Generated in Xs" display after completion

### WorkflowStatus Component
New component showing:
- Overall progress percentage (20% per completed phase)
- Phase status icons (✓ complete, ⟳ generating, ⚠ incomplete)
- "Continue" button to jump to incomplete phase
- "Start New Lecture" to clear all data

### Build Fixes
- Fixed duplicate Timer component code in Phase1StrategicFoundation.tsx and Phase3LectureGeneration.tsx
- Added missing function declaration in Phase1StrategicFoundation.tsx
- Fixed React setState in useEffect warnings
- Fixed TypeScript errors in ai/service.ts catch clauses
- Added WorshipSong type import in phase3 route

## Current Issues

### Lint Warnings (Non-Blocking)
- Unused imports in various files
- Image alt props missing in Phase4VisualAssets.tsx
- pdf.worker.mjs has various lint errors (third-party, ignored)

### ESLint Errors in Third-Party Files
These are in files that should be excluded or configured:
- `public/pdf/pdf.worker.mjs` - require() imports, this aliasing
- `test-all-phases.js` - require() style imports

## Environment Variables
Create `.env.local` with:
```
ANTHROPIC_API_KEY=your-key
```

Config supports `${VAR:-default}` format for model IDs.

## Known Quirks
- "Use This Text" button state depends on extractedText being set in FileUploader
- Resume detection checks: uploadedText, phase1.options, phase2.options, phase3.lecture, phase4.visualAssets
- Navigation Next button disabled until phase requirements met
- Generation times: Phase1 ~30-60s, Phase2 ~30-60s, Phase3 ~60-120s, Phase4 ~15-30s

## Testing Notes
To test complete workflow:
1. Upload PDF/DOCX/txt
2. Click "Use This Text" → Next enabled
3. Generate Strategy → Select Option → Next enabled
4. Generate Narrative → Select Story → Next enabled
5. Generate Lecture → Done
6. Generate Visual Assets → Done
