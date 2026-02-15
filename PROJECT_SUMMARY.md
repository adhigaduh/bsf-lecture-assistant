# BSF Lecture Assistant - Project Summary

## Current Status (Last Updated: Feb 15, 2026)

## Overview
Agentic web application for Indonesian adult men to generate BSF (Bible Study Fellowship) lecture materials. 5-phase workflow: Upload → Strategy → Narrative → Lecture → Visuals.

## Tech Stack
- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript
- **State Management**: Zustand with persistence (localStorage)
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **AI**: Anthropic Claude Sonnet (phase1-3), Google Gemini (images)
- **PDF Processing**: pdfjs-dist
- **Authentication**: Simple email/password with auto-registration
- **Documents**: File-based storage in `documents/{userId}/`

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

## Environment Variables (.env.local)
```
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key_for_images
```

## Project Structure

### Core Application Files
- `app/page.tsx` - Main page with 5-phase navigation
- `app/login/page.tsx` - Authentication page
- `lib/workflow-store.ts` - Zustand store (1,000+ lines)
- `types/workflow.ts` - TypeScript interfaces
- `lib/ai/service.ts` - AI service layer with prompts

### Workflow Phases (Components)

#### Phase 1: File Upload
- **Component**: `components/FileUploader.tsx`
- **Features**:
  - Upload multiple files at once (PDF, DOCX, TXT)
  - ALL files combined when processing (not just selected)
  - Drag-and-drop support
  - File list with preview and individual removal
  - Manual text entry option
- **API**: `app/api/upload/route.ts`
- **Status**: ✅ Working

#### Phase 2: Strategic Foundation
- **Component**: `components/Phase1StrategicFoundation.tsx`
- **Features**: Generate 3 options, select with edit mode, timer
- **API**: `app/api/generate/phase1/route.ts`
- **Edit Mode**: Can edit aim, divisions, principles before accepting
- **Cancel Button**: ✅ Added - stops generation via AbortController
- **Status**: ✅ Working

#### Phase 3: Narrative Arc
- **Component**: `components/Phase2NarrativeArc.tsx`
- **Features**: Generate 3 bookend stories, select with edit mode, timer
- **API**: `app/api/generate/phase2/route.ts`
- **Edit Mode**: Can edit title, opening, cliffhanger, resolution, characters, setting
- **Cancel Button**: ✅ Added - stops generation via AbortController
- **Show More**: Displays full text of all story elements
- **Status**: ✅ Working

#### Phase 4: Lecture Generation
- **Component**: `components/Phase3LectureGeneration.tsx`
- **Features**: Generate full lecture (~3500 words), tabs for lecture/worship/outline
- **API**: `app/api/generate/phase3/route.ts`
  - Also calls `app/api/generate/applications/route.ts` for per-division applications
- **Style Upload**: Can upload markdown style file for lecture tone
- **Edit Mode**: ✅ Added - can edit entire lecture (title, intro, divisions, conclusion)
- **Cancel Button**: ✅ Added - stops generation via AbortController
- **Auto-save**: Saves to document on each phase completion
- **Button Flow**: 
  - Before save: "Accept & Save Lecture"
  - After save: "Proceed to Visual Assets"
- **Status**: ✅ Working

#### Phase 5: Visual Assets
- **Component**: `components/Phase4VisualAssets.tsx`
- **Features**: Generate AI image prompts for presentation slides
- **Visual Style Options**:
  - Auto (AI decides)
  - Photographic (realistic photos)
  - Hyper-realistic (impossible detail) ✨ NEW
  - Illustrated (drawings/illustrations)
  - Minimalist (simple, clean)
  - Textured (paper, fabric, stone textures)
  - Geometric (shapes, patterns)
  - Watercolor (painted effects)
  - Cinematic (movie-like scenes)
  - Noir (black and white, dramatic shadows) ✨ NEW
- **API**: `app/api/generate/phase4/route.ts` (prompts only)
- **Image Generation**: `app/api/generate-image/route.ts` (Google Gemini)
- **Slide Structure** (13 slides for 3 divisions):
  1. Title (lecture title, scripture, "BSF Lecture")
  2. Outline (Roman numerals I, II, III)
  3. Principle 1 + Memory 1 + Application 1
  4. Principle 2 + Memory 2 + Application 2
  5. Principle 3 + Memory 3 + Application 3
  6. Discussion
  7. Summary
- **Design Elements in Prompts**: colors, Rule of Thirds, mood, lighting
- **Cancel Button**: ✅ Added - stops generation via AbortController
- **Regenerate**: ✅ Added - can regenerate prompts without losing lecture
- **Image Generation**: Currently text-only prompts (API issues with Gemini images)
- **Status**: ⚠️ Prompts work, image generation unreliable

### Document System
- **Location**: `documents/{userId}/{documentId}.json`
- **Features**: 
  - Auto-create on text upload
  - Auto-save after each phase selection
  - Load/resume from any phase
  - Delete with confirmation
- **Panel**: Right sidebar with document cards
- **Status**: ✅ Working

### Supporting Components
- `components/WorkflowStatus.tsx` - Resume work card with progress
- `components/ProgressBar.tsx` - Phase progress indicator
- `components/SettingsPanel.tsx` - Language (EN/ID), AI settings
- `components/DocumentPanel.tsx` - Document management sidebar

## Recent Features & Fixes

### Multiple File Upload Support ✅ (Feb 15, 2026)
- Upload multiple files at once (PDF, DOCX, TXT)
- **ALL uploaded files combined** when processing to Phase 1
- File list display with selection for preview
- Individual file removal with trash icon
- File count badge and character counts per file
- Button changes to "Use All Files (N)" with count
- Success message shows "N file(s) combined and ready!"
- Playwright tests: 7/7 passing
- Files separated with filename headers in combined text

### Visual Style Enhancements ✅ (Feb 15, 2026)
- Added "noir" visual style option (black and white, dramatic shadows)
- Added "hyper-realistic" visual style option (impossible detail)
- Placed in Phase 4 Visual Assets style selector

## Recent Features & Fixes (Feb 14, 2026)

### Cancel/Stop Buttons ✅
All phases now have Cancel buttons during generation:
- Phase 1: "Cancel" (red button)
- Phase 2: "Cancel" (red button)
- Phase 3: "Cancel" (red button)
- Phase 4: "Cancel" (red button)
- Uses AbortController to properly cancel fetch requests
- Prevents stuck "Generating..." states

### Edit Modes ✅
- Phase 1: Edit aim, divisions, principles before accepting
- Phase 2: Edit story title, opening, cliffhanger, resolution, characters, setting
- Phase 3: Edit entire lecture (title, intro, all divisions, conclusion)
- Flow: Select → Edit → Accept → Proceed

### Application Questions ✅
- Generated via separate AI calls after lecture
- One per division per age group (9 total)
- Progress bar shows "Generating Application Questions"
- Each division gets custom questions for Young Professionals, Fathers/Mid-life, Elders

### Navigation Fixes ✅
- Fixed `nextPhase()` - changed `current < 4` to `current < 5`
- Can now navigate from Phase 4 to Phase 5
- Footer Next button works correctly

### Visual Assets Structure ✅
- 13 slides for 3-division lecture
- Per-division memory slides with mnemonics/acronyms
- Design elements: colors, Rule of Thirds, mood, lighting
- Discussion and Summary slides at end

### Image Generation Issues ⚠️
- Gemini API doesn't reliably generate images
- Currently generates prompts only
- Aspect ratio requested in text (not API parameter)
- May need fallback to placeholder images or different API

## Known Issues

### High Priority
1. **Image Generation Unreliable**: Gemini API often fails to generate actual images
   - Workaround: Generates text prompts only
   - Potential fix: Use placeholder images or different API

2. **Application Questions Timeout**: Sometimes takes >3 minutes
   - Current: 3-minute timeout
   - May need to increase or optimize

### Medium Priority
3. **Style Analysis**: Limited detection of tone/style from uploaded markdown
   - Could enhance with more sophisticated parsing

4. **Lecture Length**: Sometimes exceeds 4000 words
   - Token limit is 15000 but actual output varies
   - Could add trimming or summarization

### Low Priority
5. **ESLint Warnings**: Unused imports, missing alt props
6. **Type Warnings**: Some strict TypeScript errors in edge cases

## Testing Checklist

### Full Workflow Test
1. ✅ Login/Register
2. ✅ Upload text file (single or multiple)
3. ✅ Verify multiple files combined when processing
4. ✅ Generate Phase 1 options
5. ✅ Edit Phase 1 selection
6. ✅ Accept and proceed to Phase 2
7. ✅ Generate Phase 2 stories
8. ✅ Edit Phase 2 selection
9. ✅ Accept and proceed to Phase 3
10. ✅ Generate lecture
11. ✅ Edit lecture
12. ✅ Accept & Save
13. ✅ Proceed to Phase 4
14. ✅ Generate visual prompts
15. ✅ (Optional) Try image generation

### Multiple File Upload Test
1. ✅ Upload single file - shows in list
2. ✅ Upload multiple files - all shown in list
3. ✅ Select different files for preview
4. ✅ Remove individual files
5. ✅ File count and character counts display
6. ✅ Click "Use All Files" - combines all content
7. ✅ Verify combined text sent to Phase 1

### Cancel Button Test
1. Start generation in any phase
2. Click Cancel button
3. Verify loading stops immediately
4. Verify can restart generation

### Edit Mode Test
1. Generate options in Phase 1 or 2
2. Select an option
3. Click Edit button (or it opens automatically)
4. Modify some text
5. Click Accept Changes
6. Verify changes saved
7. Click Cancel to discard changes

### Document System Test
1. Upload text (auto-creates document)
2. Complete phases
3. Check documents panel shows current doc
4. Create second document
5. Switch between documents
6. Delete a document

## Next Development Priorities

1. **Fix Image Generation**: 
   - Consider OpenAI DALL-E
   - Or use placeholder images
   - Or pre-made slide templates

2. **Enhance Application Questions**:
   - Better integration into lecture flow
   - More contextual to each division

3. **Export Features**:
   - Export lecture as formatted document
   - Export slides as presentation (PPTX)
   - Export images as zip

4. **UI Polish**:
   - Better loading states
   - Error boundaries
   - Mobile responsiveness

5. **Testing**:
   - Playwright E2E tests
   - Unit tests for parsers

## Git Repository
```bash
# Remote
origin: https://github.com/adhigaduh/bsf-lecture-assistant.git
branch: main

# Recent commits (Feb 15, 2026)
- Add multiple file upload support and noir/hyper-realistic visual styles

# Recent commits (Feb 14, 2026)
- Add design elements to visual prompts
- Remove unsupported aspectRatio parameter
- Add Cancel buttons and Lecture Edit feature
- Add Regenerate button and enforce mandatory slides
- Fix Phase 4 regenerate button and improve image aspect ratio
```

## Server Status
- Dev server: `npm run dev` → http://localhost:3000
- Build: `npm run build` → ✅ Passing
- Last restart: Feb 15, 2026

---

## For Next Session

If you're picking up this project:

1. **Start server**: `npm run dev`
2. **Check status**: All phases should be functional
3. **Priority fix**: Image generation in Phase 4 (currently prompts only)
4. **Test workflow**: Run through all 5 phases to verify
5. **Check logs**: `tail -f server.log` for any errors

**Key files to understand:**
- `lib/workflow-store.ts` - All state management
- `lib/ai/service.ts` - All AI prompts
- `components/Phase3LectureGeneration.tsx` - Most complex component
- `app/api/generate/phase4/route.ts` - Visual prompts generation

**Current blocker**: Image generation API unreliable. Everything else works.
