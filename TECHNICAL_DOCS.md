# BSF Lecture Assistant - Technical Documentation

## Project Overview

**BSF Lecture Assistant** is a Next.js web application for generating Bible Study Fellowship (BSF) lecture materials for Indonesian adult men. It uses a 4-phase workflow powered by AI (Anthropic Claude).

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **State Management**: Zustand with localStorage persistence
- **UI Components**: Radix UI + shadcn/ui
- **AI**: Anthropic Claude API
- **File Processing**: pdf-parse, mammoth (PDF/DOCX)

## Architecture

### Directory Structure

```
my-app78/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   ├── phase1/route.ts    # Strategic Foundation
│   │   │   ├── phase2/route.ts    # Narrative Arc
│   │   │   ├── phase3/route.ts    # Lecture Generation
│   │   │   └── phase4/route.ts    # Visual Assets
│   │   ├── save-lecture/route.ts  # Save to file
│   │   └── upload/route.ts         # File processing
│   ├── layout.tsx
│   └── page.tsx                   # Main workflow page
├── components/
│   ├── FileUploader.tsx           # Phase 1: Upload
│   ├── Phase1StrategicFoundation.tsx
│   ├── Phase2NarrativeArc.tsx
│   ├── Phase3LectureGeneration.tsx
│   ├── Phase4VisualAssets.tsx
│   ├── SettingsPanel.tsx
│   └── ui/                        # shadcn components
├── lib/
│   ├── workflow-store.ts           # Zustand store
│   ├── ai/
│   │   └── service.ts             # AI service (Claude)
│   └── export/
│       ├── markdown.ts
│       └── pptx.ts
├── types/
│   └── workflow.ts                # TypeScript types
└── pdfs/                         # Upload test files
```

### Workflow Phases

1. **Phase 1: Upload** - Extract text from PDF/DOCX
2. **Phase 2: Strategic Foundation** - Generate aim & divisions
3. **Phase 3: Narrative Arc** - Generate story options
4. **Phase 4: Lecture Generation** - Full manuscript with applications
5. **Phase 5: Visual Assets** - AI image prompts

### State Management

The Zustand store (`lib/workflow-store.ts`) manages all workflow state:

```typescript
interface WorkflowState {
  currentPhase: number;
  uploadedText: string;
  phase1: { options: [], selected: null, isGenerating: false };
  phase2: { options: [], selected: null, isGenerating: false };
  phase3: { lecture: null, worshipSongs: [], isGenerating: false };
  phase4: { visualAssets: [], isGenerating: false };
  settings: { language: 'en', autoSave: true, quickMode: false };
}
```

**Important**: Zustand persist middleware wraps state in `{ state: ... }` format in localStorage.

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Extract text from PDF/DOCX |
| `/api/generate/phase1` | POST | Generate strategic foundation options |
| `/api/generate/phase2` | POST | Generate narrative/story options |
| `/api/generate/phase3` | POST | Generate full lecture manuscript |
| `/api/generate/phase4` | POST | Generate visual asset prompts |
| `/api/save-lecture` | POST | Save markdown to server |

### AI Service

Located in `lib/ai/service.ts`:
- Uses Anthropic Claude API
- Token limits: Phase 1-2: 12000, Phase 3: 15000
- Prompt templates for each phase

### Key Components

#### Phase3LectureGeneration.tsx

This is the main lecture display component. Important sections:

- **Introduction**: Story opening + cliffhanger
- **Divisions**: Each division contains:
  - Title & Scripture reference
  - Principle
  - Exposition
  - **Applications**: 3 age groups (Young Professionals, Fathers/Mid-life, Elders)
- **Conclusion**: Story resolution + Call to Action + Closing Prayer

#### Export Functions

- `exportToMarkdown()` - Generates markdown with full lecture content
- Includes all divisions, principles, expositions, and application questions

### Common Issues & Fixes

1. **JSON Parse Errors**: Increase token limits in `lib/ai/service.ts`
2. **Hydration Errors**: Wait for store hydration before checking canProceed
3. **API Field Naming**: AI returns inconsistent field names - always normalize in component
4. **localStorage Format**: Zustand persist wraps in `{ state: ... }`

## Development Commands

```bash
npm run dev    # Start development server
npm run build  # Production build
npm run lint   # Run ESLint
```

## Environment Variables

Required in `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Adding New Features

### To add a new workflow phase:
1. Create new component in `components/PhaseX*.tsx`
2. Add API route in `app/api/generate/phaseX/`
3. Add state in `lib/workflow-store.ts`
4. Add to workflow navigation in `app/page.tsx`

### To modify lecture structure:
1. Update types in `types/workflow.ts`
2. Update AI prompt in `lib/ai/service.ts`
3. Update normalization in `Phase3LectureGeneration.tsx`
4. Update export in `lib/export/markdown.ts`

## Testing

Playwright tests: `test-workflow-full.js`

Run with: `node test-workflow-full.js`
