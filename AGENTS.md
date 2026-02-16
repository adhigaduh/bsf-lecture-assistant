# AI Agent Guidelines

## Development Notes

### Token Limits and JSON Errors

**Always consider token limits as a potential source of JSON parsing errors.**

When AI calls return malformed JSON:
1. Check the token allocation in `lib/ai/service.ts`
2. Compare with other similar calls that work correctly
3. Increase token limit if too low

**Example fix:**
```typescript
// Before: 1500 tokens (too low for 5 songs with full details)
const response = await this.callAI(prompt, 1500);

// After: 4000 tokens (sufficient)
const response = await this.callAI(prompt, 4000);
```

**Token allocations in this project:**
| Function | Tokens | Status |
|----------|--------|--------|
| Phase 1 (generateOptions) | 12000 | OK |
| Phase 2 (generateNarrative) | 15000 | OK |
| Phase 3 (generateLecture) | ~~8000~~ → 20000 | Fixed |
| Phase 4 (generateVisualAssets) | 8000 | OK |
| Design Themes | 2000 | OK |
| Worship Songs (generateWorshipSongs) | ~~1500~~ → 4000 | Fixed |
| Application Questions | 1000 | OK |

---

## Playwright Testing

### Installation Status
Playwright is already installed:
- `playwright`: ^1.58.2 (runtime)
- `@playwright/test`: ^1.58.2 (dev dependency)

No installation needed - just run tests.

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/worship-songs.spec.ts

# Run with UI (interactive)
npx playwright test --ui

# Run with visible browser (debug)
npx playwright test --headed
```

### Test Configuration
- Config file: `playwright.config.ts`
- Test directory: `tests/`
- Base URL: http://localhost:3000
- Test timeout: 180000ms (adjust if AI calls are slow)
- WebServer: npm run dev (auto-starts on first test)

---

## Existing Tests (Validation Suite)

Run these before release to verify core functionality:

### 1. Worship Songs (`tests/worship-songs.spec.ts`)
- **Purpose**: Verify AI generates worship songs correctly
- **Tests**: 1 test
- **Runtime**: ~2 minutes (calls AI API)

```bash
npx playwright test tests/worship-songs.spec.ts
```

### 2. Multiple File Upload (`tests/multiple-file-upload.spec.ts`)
- **Purpose**: Verify file upload feature works
- **Tests**: 6 tests
- **Covers**: Single/multiple file upload, selection, removal, file combining

```bash
npx playwright test tests/multiple-file-upload.spec.ts
```

### 3. Markdown Style Upload (`tests/markdown-style-upload.spec.ts`)
- **Purpose**: Verify style reference file upload in Phase 3
- **Tests**: 8 tests
- **Covers**: File picker, drag-drop, analysis display, preview, clear

```bash
npx playwright test tests/markdown-style-upload.spec.ts
```

### 4. Full Workflow (`tests/markdown-style-upload-full.spec.ts`)
- **Purpose**: End-to-end workflow test
- **Tests**: 1 test (long running)

```bash
npx playwright test tests/markdown-style-upload-full.spec.ts
```

---

## Release Validation Checklist

Before each release, run:

```bash
# 1. All tests
npx playwright test

# 2. Lint
npm run lint

# 3. Build
npm run build
```

---

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **State**: Zustand with localStorage persistence
- **AI**: Vercel AI SDK (OpenAI, Anthropic)
- **Testing**: Playwright

### Key Files
| Path | Purpose |
|------|---------|
| `lib/ai/service.ts` | AI generation (all 4 phases) |
| `lib/workflow-store.ts` | Zustand state management |
| `config/config.yaml` | All settings (AI, features) |
| `components/Phase{1-4}*.tsx` | UI components |

### 4-Phase Workflow
1. **Upload**: File input (PDF, DOCX, text)
2. **Strategy (Phase1)**: Aim & Divisional Principles
3. **Narrative (Phase2)**: Bookend Stories
4. **Lecture (Phase3)**: Full manuscript + worship songs
5. **Visuals (Phase4)**: AI image prompts

---

## Common Gotchas

### Authentication
- Login requires form submission, not just localStorage
- User stored in `bsf-user` localStorage key after login
- Workflow state in `bsf-lecture-workflow` localStorage

### Phase Navigation
- Phase buttons disabled until prior phases complete
- Must select an option in Phase 1 and Phase 2 to enable Phase 3
- Lecture button (Phase 3) disabled if no selections made

### API Routes
- `/api/generate/phase1` - Aim & Divisions generation
- `/api/generate/phase2` - Story generation
- `/api/generate/phase3` - Lecture + worship songs
- `/api/generate/phase4` - Visual assets
- `/api/upload` - File processing (PDF, DOCX)
- `/api/export/pptx` - PowerPoint export
- `/api/export/markdown` - Markdown export

### Feature Flags (config/config.yaml)
- `worship_song_suggestions`: true/false
- `export_to_powerpoint`: true/false
- `export_to_google_docs`: true/false
- `quick_mode`: true/false
- `dark_mode`: true/false

---

## Testing New Features

When adding new AI features:
1. Add token allocation in `lib/ai/service.ts`
2. Check AGENTS.md table and update if needed
3. Add Playwright test in `tests/`
4. Run test to verify it works
5. Add to release validation checklist

When debugging AI JSON errors:
1. Check token allocation first (see table above)
2. Check server logs for parse errors
3. Increase tokens if response is truncated
