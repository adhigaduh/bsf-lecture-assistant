# BSF Lecture Assistant

An AI-powered web application for creating Bible Study Fellowship (BSF) lectures specifically designed for Indonesian adult men. Features a 4-phase guided workflow with worship song suggestions and PowerPoint export.

## Features

### Core Workflow
- **Phase 1**: Strategic Foundation - Analyze biblical text and generate Aim & Divisional Principles
- **Phase 2**: Narrative Arc - Generate engaging "Bookend Stories" for opening/closing
- **Phase 3**: Lecture Generation - Full manuscript with age-specific applications
- **Phase 4**: Visual Assets - AI image prompts for slides

### Additional Features
- 🗣️ **Worship Song Suggestions** - AI-generated song recommendations with thematic connection
- 📊 **PowerPoint Export** - Create presentation slides automatically
- 📝 **Multiple Export Formats** - Markdown, JSON, and more
- 🌍 **Bilingual Support** - English and Indonesian interface
- ⚡ **Quick Mode** - Skip options for experienced users
- 💾 **Auto-Save** - Never lose your progress

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand with persistence
- **AI**: Vercel AI SDK (OpenAI, Anthropic)
- **PDF Processing**: pdf-parse, mammoth
- **Export**: pptxgenjs, docx

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for at least one AI provider (OpenAI or Anthropic)

### Installation

1. Clone the repository:
```bash
cd my-app78
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your API keys:
```env
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Configuration

All settings are managed in `config/config.yaml`:

- AI Provider selection
- Model configuration
- Workflow options
- Export settings
- Feature flags

## Usage

### Creating a Lecture

1. **Upload or Paste Text**: Import your BSF lesson material (PDF, DOCX, or text)
2. **Phase 1**: Review and select the best Aim & Divisions (3 options with confidence scores)
3. **Phase 2**: Choose a Bookend Story concept (3 options with resonance scores)
4. **Phase 3**: Review the full lecture manuscript with worship song suggestions
5. **Phase 4**: Get AI image prompts for your slides

### Export Options

- **Markdown**: Full manuscript with all sections
- **PowerPoint**: Ready-to-use presentation slides
- **JSON**: Complete data backup
- **Google Docs**: Direct export (requires OAuth setup)

## Project Structure

```
my-app78/
├── app/
│   ├── api/
│   │   ├── generate/       # AI generation endpoints
│   │   ├── upload/         # File upload handler
│   │   └── export/         # Export handlers
│   ├── lib/
│   │   ├── ai/             # AI service
│   │   ├── config.ts        # YAML config loader
│   │   ├── export/         # Export utilities
│   │   └── workflow-store.ts
│   └── page.tsx            # Main app
├── components/             # React components
├── config/                 # config.yaml
└── types/                  # TypeScript definitions
```

## API Keys

### OpenAI
- Get keys from: https://platform.openai.com/api-keys
- Models: GPT-4o, GPT-4o-mini

### Anthropic
- Get keys from: https://console.anthropic.com/
- Models: Claude 3.5 Sonnet, Claude 3 Opus

## Troubleshooting

### PDF Upload Fails
- Ensure file is under 50MB
- Try converting scanned PDFs to text-based PDFs

### AI Generation Errors
- Verify API keys are set correctly
- Check your quota/usage limits
- Try a different model in settings

### Export Issues
- PowerPoint export requires phase 3 completion
- Check browser allows multiple downloads

## License

MIT License - Feel free to use and modify for your ministry needs.

## Contributing

Pull requests welcome! For major changes, please open an issue first.

---

Built with ❤️ for BSF leaders worldwide
