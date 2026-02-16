import { 
  StrategicFoundation, 
  NarrativeArc, 
  Lecture, 
  VisualAsset, 
  WorshipSong,
  AIProvider,
  AIModel,
  WorkflowSettings
} from '@/types/workflow';
import { loadConfig, getDefaultModel, getLanguageInstruction } from '@/lib/config.server';

interface GenerationOptions {
  phase: number;
  text: string;
  context?: {
    phase1Selection?: StrategicFoundation;
    phase2Selection?: NarrativeArc;
    phase3Lecture?: Lecture;
    optionsCount?: number;
    settings?: Partial<WorkflowSettings>;
    preferences?: {
      visualStyle?: string;
      colorPalette?: string;
      mood?: string;
    };
  };
  styleMarkdown?: string;
  model?: string;
}

export class AIService {
  private provider: AIProvider | null;
  private model: AIModel;

  constructor() {
    let config;
    try {
      config = loadConfig();
    } catch {
      config = null;
    }
    
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;
    
    // Check if config specifies a specific active provider
    const activeProviderId = config?.ai_providers?.active;
    
    // Helper to get provider from config
    const getProviderFromConfig = (providerId: string) => {
      return config?.ai_providers?.providers?.find(p => p.id === providerId);
    };
    
    // Initialize based on active provider in config, or fall back to key availability
    if (activeProviderId === 'gemini' && googleKey && config) {
      const geminiConfig = getProviderFromConfig('gemini');
      this.provider = {
        name: 'Google Gemini',
        id: 'gemini',
        enabled: true,
        models: geminiConfig?.models || [{
          id: 'gemini-2.0-flash',
          name: 'Gemini 2.0 Flash',
          max_tokens: 8192,
          temperature: 0.7,
        }],
        env_var: 'GOOGLE_API_KEY',
        base_url: 'https://generativelanguage.googleapis.com',
      };
      this.model = this.provider.models[0];
    } else if (activeProviderId === 'anthropic' && anthropicKey && config) {
      this.provider = {
        name: 'Anthropic',
        id: 'anthropic',
        enabled: true,
        models: config.ai_providers.providers.find(p => p.id === 'anthropic')?.models || [{
          id: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
          name: 'Claude Sonnet',
          max_tokens: 8192,
          temperature: 0.7,
          cost_per_1k_input: 0.003,
          cost_per_1k_output: 0.015,
        }],
        env_var: 'ANTHROPIC_API_KEY',
        base_url: 'https://api.anthropic.com/v1',
      };
      this.model = getDefaultModel(config) || this.provider.models[0];
    } else if (activeProviderId === 'openai' && openaiKey && config) {
      this.provider = {
        name: 'OpenAI',
        id: 'openai',
        enabled: true,
        models: config.ai_providers.providers.find(p => p.id === 'openai')?.models || [{
          id: process.env.OPENAI_MODEL || 'gpt-4o',
          name: 'GPT-4o',
          max_tokens: 4096,
          temperature: 0.7,
          cost_per_1k_input: 0.005,
          cost_per_1k_output: 0.015,
        }],
        env_var: 'OPENAI_API_KEY',
        base_url: 'https://api.openai.com/v1',
      };
      this.model = getDefaultModel(config) || this.provider.models[0];
    } else if (anthropicKey && config) {
      this.provider = {
        name: 'Anthropic',
        id: 'anthropic',
        enabled: true,
        models: config.ai_providers.providers.find(p => p.id === 'anthropic')?.models || [{
          id: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
          name: 'Claude Sonnet',
          max_tokens: 8192,
          temperature: 0.7,
          cost_per_1k_input: 0.003,
          cost_per_1k_output: 0.015,
        }],
        env_var: 'ANTHROPIC_API_KEY',
        base_url: 'https://api.anthropic.com/v1',
      };
      this.model = getDefaultModel(config) || this.provider.models[0];
    } else if (openaiKey && config) {
      this.provider = {
        name: 'OpenAI',
        id: 'openai',
        enabled: true,
        models: config.ai_providers.providers.find(p => p.id === 'openai')?.models || [{
          id: process.env.OPENAI_MODEL || 'gpt-4o',
          name: 'GPT-4o',
          max_tokens: 4096,
          temperature: 0.7,
          cost_per_1k_input: 0.005,
          cost_per_1k_output: 0.015,
        }],
        env_var: 'OPENAI_API_KEY',
        base_url: 'https://api.openai.com/v1',
      };
      this.model = getDefaultModel(config) || this.provider.models[0];
    } else if (googleKey && config) {
      const geminiConfig = getProviderFromConfig('gemini');
      this.provider = {
        name: 'Google Gemini',
        id: 'gemini',
        enabled: true,
        models: geminiConfig?.models || [{
          id: 'gemini-2.0-flash',
          name: 'Gemini 2.0 Flash',
          max_tokens: 8192,
          temperature: 0.7,
        }],
        env_var: 'GOOGLE_API_KEY',
        base_url: 'https://generativelanguage.googleapis.com',
      };
      this.model = this.provider.models[0];
    } else if (anthropicKey) {
      this.provider = {
        name: 'Anthropic',
        id: 'anthropic',
        enabled: true,
        models: [{
          id: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
          name: 'Claude Sonnet',
          max_tokens: 8192,
          temperature: 0.7,
          cost_per_1k_input: 0.003,
          cost_per_1k_output: 0.015,
        }],
        env_var: 'ANTHROPIC_API_KEY',
        base_url: 'https://api.anthropic.com/v1',
      };
      this.model = this.provider.models[0];
    } else if (googleKey) {
      this.provider = {
        name: 'Google Gemini',
        id: 'gemini',
        enabled: true,
        models: [{
          id: 'gemini-2.0-flash',
          name: 'Gemini 2.0 Flash',
          max_tokens: 8192,
          temperature: 0.7,
        }],
        env_var: 'GOOGLE_API_KEY',
        base_url: 'https://generativelanguage.googleapis.com',
      };
      this.model = this.provider.models[0];
    } else {
      this.provider = null;
      this.model = {
        id: process.env.OPENAI_MODEL || 'gpt-4o',
        name: 'GPT-4o',
        max_tokens: 4096,
        temperature: 0.7,
      };
    }
  }

  private getLanguageInstruction(language?: string): string {
    try {
      const config = loadConfig();
      return getLanguageInstruction(config, language);
    } catch {
      return language === 'id' 
        ? "LANGUAGE: INDONESIAN (seluruh khotbah harus dalam bahasa Indonesia)"
        : "LANGUAGE: ENGLISH (entire lecture must be in English)";
    }
  }

  async generateStrategicFoundation(options: GenerationOptions): Promise<StrategicFoundation[]> {
    if (!this.provider) {
      throw new Error('No AI provider configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    }
    const prompt = this.buildPhase1Prompt(options);
    const response = await this.callAI(prompt, 12000);
    return this.parsePhase1Response(response);
  }

  async generateNarrativeArc(options: GenerationOptions): Promise<NarrativeArc[]> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const prompt = this.buildPhase2Prompt(options);
    const response = await this.callAI(prompt, 12000);
    return this.parsePhase2Response(response);
  }

  async generateLecture(options: GenerationOptions): Promise<Lecture> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const prompt = this.buildPhase3Prompt(options);
    const response = await this.callAI(prompt, 20000);
    return this.parsePhase3Response(response);
  }

  async generateDesignThemes(options: GenerationOptions): Promise<any[]> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const prompt = this.buildDesignThemesPrompt(options);
    const response = await this.callAI(prompt, 2000);
    return this.parseDesignThemesResponse(response);
  }

  async generateVisualAssets(options: GenerationOptions, theme?: any): Promise<VisualAsset[]> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const prompt = this.buildPhase4Prompt(options, theme);
    const response = await this.callAI(prompt, 8000);
    return this.parsePhase4Response(response);
  }

  async generateWorshipSongs(options: GenerationOptions): Promise<WorshipSong[]> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const prompt = this.buildWorshipSongPrompt(options);
    const response = await this.callAI(prompt, 4000);
    return this.parseWorshipSongResponse(response);
  }

  async generateApplicationQuestion(options: {
    division: any;
    ageGroup: 'youngProfessionals' | 'fathersMidLife' | 'elders';
    context?: any;
  }): Promise<string> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const { division, ageGroup, context } = options;
    const prompt = this.buildApplicationPrompt(division, ageGroup, context);
    const response = await this.callAI(prompt, 1000);
    return this.parseApplicationResponse(response);
  }

  private buildPhase1Prompt(options: GenerationOptions): string {
    const optionsCount = options.context?.optionsCount || 3;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);
    const targetAudience = options.context?.settings?.targetAudience || 'Indonesian adult men';
    
    return `
Analyze the following biblical text and generate ${optionsCount} distinct options for the Overall Aim and Divisional Principles.

${languageInstruction}

TEXT:
${options.text}

TARGET AUDIENCE: ${targetAudience}

For each option, provide:
1. **Aim:** A single sentence summary of the lesson's goal
2. **Divisions:** Break the pericope into 2-4 logical subsections
3. **Principles:** For each division, write a complete sentence stating a universal spiritual truth about God or men in reference to God
4. **Confidence Score:** A probability percentage (0-100%) based on textual accuracy and relevance to ${targetAudience}
5. **Reasoning:** A brief explanation (2-3 sentences) explaining why this option scored this confidence level, specifically addressing how the aim, divisions, and principles connect to the life experiences, challenges, and spiritual needs of ${targetAudience} (ages 20s-60s) in their workplace, family, and faith journey

Format each option as JSON:
{
  "id": "option_1",
  "aim": "...",
  "divisions": [
    {
      "id": "div_1",
      "title": "...",
      "scriptureRange": "...",
      "principle": "...",
      "keyVerses": ["..."]
    }
  ],
  "confidenceScore": 85,
  "reasoning": "..."
}
    `.trim();
  }

  private buildPhase2Prompt(options: GenerationOptions): string {
    const optionsCount = options.context?.optionsCount || 3;
    const phase1 = options.context?.phase1Selection;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);
    const targetAudience = options.context?.settings?.targetAudience || 'Indonesian adult men';
    
    const divisionsText = phase1?.divisions 
      ? phase1.divisions.map(d => `- ${d.title}: ${d.principle}`).join('\n')
      : 'Not specified';

    return `
Based on the selected Strategic Foundation, generate ${optionsCount} distinct "Bookend Story" options for a lecture.

${languageInstruction}

TARGET AUDIENCE: ${targetAudience}

SELECTED AIM:
${phase1?.aim || 'Not specified'}

DIVISIONS:
${divisionsText}

Generate stories that:
1. Create empathy and engagement with the target audience (${targetAudience})
2. Fit the theological aim of the lesson
3. Differ in tone (historical, personal illustration, contemporary news, biblical)

Format as JSON:
{
  "id": "story_1",
  "title": "...",
  "tone": "personal",
  "opening": "...",
  "cliffhanger": "...",
  "resolution": "...",
  "resonanceScore": 85,
  "characters": [
    {"name": "...", "role": "...", "description": "..."}
  ],
  "setting": {
    "time": "...",
    "place": "...",
    "context": "..."
  }
}
    `.trim();
  }

  private buildPhase3Prompt(options: GenerationOptions): string {
    const phase1 = options.context?.phase1Selection;
    const phase2 = options.context?.phase2Selection;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);
    const targetAudience = options.context?.settings?.targetAudience || 'Indonesian adult men';
    const langSpecific = language === 'id' ? 'dalam bahasa Indonesia' : 'in English';
    const styleMarkdown = options.styleMarkdown;

    let styleSection = '';
    if (styleMarkdown && styleMarkdown.trim().length > 0) {
      styleSection = `
STYLE REFERENCE:
Use the following markdown content as a style guide for tone, structure, and writing approach:
${styleMarkdown.substring(0, 3000)}
`;
    }

    return `
Write the full lecture manuscript based on the selected Strategic Foundation and Narrative Arc.

TARGET WORD COUNT: 3600-4000 words total (aim for ~3800 words)
- Introduction: 450-500 words
- Each Division (Body): 800-1000 words per division (includes exposition, principle, application)
- Conclusion: 450-500 words

${languageInstruction}
${styleSection}

SELECTED AIM:
${phase1?.aim || 'Not specified'}

DIVISIONS:
${phase1?.divisions?.map((d, i) => `
DIVISION ${i + 1}: ${d.title}
Scripture: ${d.scriptureRange}
Principle: ${d.principle}
`).join('\n') || 'Not specified'}

SELECTED STORY:
Title: ${phase2?.title || 'Not specified'}
Opening: ${phase2?.opening || 'Not specified'}
Cliffhanger: ${phase2?.cliffhanger || 'Not specified'}
Resolution: ${phase2?.resolution || 'Not specified'}

REQUIRED STRUCTURE - Each section MUST include a "word_count" field:
{
  "title": "Lecture Title",
  "scriptureReference": "Genesis 22:1-19",
  "introduction": {
    "word_count": 480,
    "storyOpening": "Full opening story content (450-500 words)...",
    "cliffhanger": "The cliffhanger that hooks listeners...",
    "transitionToText": "Transition to biblical text..."
  },
  "body": [
    {
      "word_count": 920,
      "title": "Division 1 Title",
      "scriptureRange": "Genesis 22:1-2",
      "exposition": {
        "word_count": 450,
        "content": "Deep exposition of the passage (450+ words)..."
      },
      "principle_statement": {
        "word_count": 120,
        "content": "Clear principle statement (100-150 words)..."
      },
      "application": {
        "word_count": 350,
        "content": "Practical application with questions (350+ words)..."
      }
    }
  ],
  "conclusion": {
    "word_count": 480,
    "storyResolution": "Resolution of the story (150-200 words)...",
    "callToAction": "Call to action (100-150 words)...",
    "closingPrayer": "Closing prayer (50-100 words)...",
    "finalThought": "Memorable closing thought (50-100 words)..."
  }
}

IMPORTANT: 
- Write SUBSTANTIAL content - do not summarize or abbreviate
- Each section word_count MUST match the actual content length
- Total must be 3600-4000 words
- Include rich cultural examples relevant to ${targetAudience}
- Make applications practical and specific

Format as valid JSON only.
    `.trim();
  }

  private buildDesignThemesPrompt(options: GenerationOptions): string {
    const phase1 = options.context?.phase1Selection;
    const lecture = options.context?.phase3Lecture;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);
    const targetAudience = options.context?.settings?.targetAudience || 'Indonesian adult men';
    const preferences = options.context?.preferences || {};

    const userPreferences = [];
    if (preferences.visualStyle) {
      userPreferences.push(`Visual Style Preference: ${preferences.visualStyle}`);
    }
    if (preferences.colorPalette) {
      userPreferences.push(`Color Palette Preference: ${preferences.colorPalette}`);
    }
    if (preferences.mood) {
      userPreferences.push(`Mood Preference: ${preferences.mood}`);
    }

    const preferencesText = userPreferences.length > 0 
      ? `\nUSER PREFERENCES (please respect these):\n${userPreferences.join('\n')}\n`
      : '';

    return `
Generate 3 distinct visual design themes for a BSF lecture presentation.

${languageInstruction}

LECTURE TITLE: ${lecture?.title || phase1?.aim || 'Untitled Lecture'}
SCRIPTURE: ${lecture?.scriptureReference || 'Not specified'}

LECTURE AIM:
${phase1?.aim || 'Not specified'}

AUDIENCE:
${targetAudience}
Context: Church/Bible study setting

DIVISIONS:
${phase1?.divisions?.map((d, i) => `${i + 1}. ${d.title}: ${d.principle}`).join('\n') || 'Not specified'}
${preferencesText}
Generate 3 distinct design themes that would be effective for this lecture:

For each theme, provide:
1. name: Theme name (e.g., "Warm Sanctuary", "Dramatic Journey", "Minimalist Grace")
2. description: 2-3 sentences describing the visual approach
3. colorPalette: Array of 3-4 hex color codes with descriptive names
4. mood: Overall mood (dramatic, peaceful, triumphant, reflective, hopeful)
5. visualStyle: Specific visual style (photographic, illustrated, textured, geometric, etc.)
6. lighting: Lighting description
7. typography: Typography style (elegant, bold, clean, traditional, modern)
8. rationale: Why this theme fits the lecture content and audience

Each theme should be distinctly different from the others.

Return as JSON array:
[
  {
    "id": "theme_1",
    "name": "Theme Name",
    "description": "Description of the visual approach...",
    "colorPalette": [
      {"name": "Deep Blue", "hex": "#1E3A8A"},
      {"name": "Warm Gold", "hex": "#F59E0B"},
      {"name": "Soft Cream", "hex": "#FEF3C7"}
    ],
    "mood": "peaceful",
    "visualStyle": "photographic with soft overlays",
    "lighting": "warm golden hour with soft shadows",
    "typography": "elegant serif for headers, clean sans-serif for body",
    "rationale": "This theme works because..."
  }
]
    `.trim();
  }

  private buildPhase4Prompt(options: GenerationOptions, selectedTheme?: any): string {
    const phase1 = options.context?.phase1Selection;
    const lecture = options.context?.phase3Lecture;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);
    const targetAudience = options.context?.settings?.targetAudience || 'Indonesian adult men';

    const divisions = phase1?.divisions || [];
    const divisionCount = divisions.length;
    // Title(1) + Outline(1) + [Principle(1) + Memory(1) + Application(1)] x divisions + Discussion(1) + Summary(1)
    const totalSlides = 2 + (divisionCount * 3) + 2;

    const themeContext = selectedTheme ? `
SELECTED DESIGN THEME:
Name: ${selectedTheme.name}
Description: ${selectedTheme.description}
Color Palette: ${selectedTheme.colorPalette?.map((c: any) => c.hex).join(', ')}
Mood: ${selectedTheme.mood}
Visual Style: ${selectedTheme.visualStyle}
Lighting: ${selectedTheme.lighting}
Typography: ${selectedTheme.typography}

USE THIS THEME for ALL slides below. Consistency is key.
` : '';

    return `
Generate visual slide prompts for a BSF lecture presentation.

${languageInstruction}
${themeContext}

LECTURE TITLE: ${lecture?.title || phase1?.aim || 'Untitled Lecture'}
SCRIPTURE: ${lecture?.scriptureReference || 'Not specified'}

================================================================================
CRITICAL: TEXT-FREE BACKGROUNDS ONLY
================================================================================
The visualPrompt for EACH slide MUST generate a CLEAN BACKGROUND IMAGE with:
✓ NO text, words, letters, numbers, or typography
✓ NO readable characters or symbols
✓ NO watermarks, labels, or captions
✓ NO attempt to render written content

The textOnSlide field is provided for REFERENCE ONLY and will be added manually 
later using presentation software. DO NOT include text in the visualPrompt.

Example of CORRECT visualPrompt:
"Photorealistic mountain landscape at golden hour, warm amber and deep blue tones, 
dramatic clouds, Rule of Thirds composition, soft natural lighting, peaceful mood, 
NO TEXT, NO WORDS, NO LETTERS, clean background only"

Example of INCORRECT visualPrompt (DO NOT DO THIS):
"Mountain with text overlay saying 'Trust God', title text, scripture reference"
================================================================================

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY ${totalSlides} slides
2. Each slide MUST be 16:9 aspect ratio (1920x1080 landscape)
3. ALL visualPrompts MUST specify TEXT-FREE backgrounds (NO words, NO letters)
4. Slides MUST be in this EXACT order with these EXACT slideSection names:

SLIDE ORDER:
---
1. "Title" - Lecture title, scripture reference, "BSF Lecture"
2. "Outline" - Roman numeral list of all divisions
${divisions.map((d, i) => `
${3 + i * 3}. "Principle ${i + 1}" - Division ${i + 1} title and principle
${4 + i * 3}. "Memory ${i + 1}" - Memory aid slide for Division ${i + 1}
${5 + i * 3}. "Application ${i + 1}" - Application questions for Division ${i + 1}`).join('')}
${3 + divisionCount * 3}. "Discussion" - Discussion questions for group interaction
${4 + divisionCount * 3}. "Summary" - Key takeaways and final thoughts
---

${languageInstruction}

LECTURE TITLE: ${lecture?.title || phase1?.aim || 'Untitled Lecture'}
SCRIPTURE: ${lecture?.scriptureReference || 'Not specified'}

DIVISIONS:
${divisions.map((d, i) => `
${i + 1}. ${d.title}
   Scripture: ${d.scriptureRange}
   Principle: ${d.principle}
   Exposition themes: ${lecture?.body?.[i]?.exposition?.substring(0, 200) || 'Based on the division principle'}
   Applications:
   - Young Professionals: ${lecture?.body?.[i]?.applications?.youngProfessionals?.question || 'N/A'}
   - Fathers/Mid-life: ${lecture?.body?.[i]?.applications?.fathersMidLife?.question || 'N/A'}
   - Elders: ${lecture?.body?.[i]?.applications?.elders?.question || 'N/A'}`).join('\n')}

=== SLIDE SPECIFICATIONS ===

${selectedTheme ? `
CRITICAL: A SELECTED THEME HAS BEEN PROVIDED ABOVE.
FOR ALL SLIDES BELOW, you MUST use the theme's specification:
- Use ONLY colors from the theme's palette
- Use the theme's specified mood
- Use the theme's lighting style
- Use the theme's visual style
- ALL visualPrompts MUST include "NO TEXT, NO WORDS, NO LETTERS"
- DO NOT deviate from the theme for consistency

The slide-specific suggestions below are SUBJECT MATTER GUIDELINES only.
Use them for creative direction but STICK TO the theme's visual style parameters.
` : `FOR EACH SLIDE, include these DESIGN ELEMENTS in the visualPrompt:
- colors: Specify 2-3 hex color codes that match the mood (e.g., ["#1E3A8A", "#F59E0B"])
- composition: Use "Rule of Thirds" or "centered" or "asymmetrical balance"
- mood: Choose from: dramatic, peaceful, triumphant, reflective, hopeful
- lighting: Describe lighting (e.g., "soft natural light", "dramatic backlighting", "warm golden hour")
- CRITICAL: MUST include "NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY, clean background only"`}

SLIDE 1 - "Title":
textOnSlide:
---
${lecture?.title || phase1?.aim || 'Untitled Lecture'}
${lecture?.scriptureReference || phase1?.divisions?.[0]?.scriptureRange || ''}
BSF Lecture
---
visualPrompt: Elegant background imagery reflecting the lecture theme. ${selectedTheme ? 'Use theme colors and mood exclusively. ' : 'Use Rule of Thirds composition. Include specific colors that match the mood.'} ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY. Clean background image only suitable for text overlay.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}

SLIDE 2 - "Outline":
textOnSlide:
---
Outline

${divisions.map((d, i) => `${['I', 'II', 'III', 'IV'][i]}. ${d.title} (${d.scriptureRange})`).join('\n')}
---
visualPrompt: Clean minimalist design suitable for text list overlay. ${selectedTheme ? 'MUST use theme colors. ' : 'Soft, professional colors.'} Rule of Thirds composition with space for content. NO TEXT, NO WORDS, NO LETTERS. Background image only.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}
${divisions.map((d, i) => `
SLIDE ${3 + i * 3} - "Principle ${i + 1}":
textOnSlide:
---
${d.title}
"${d.principle}"
---
visualPrompt: Visual metaphor that symbolizes this principle memorably. Abstract representation or symbolic imagery. Rule of Thirds composition. ${selectedTheme ? 'MUST use theme colors and mood. ' : 'Include specific color palette and dramatic or peaceful lighting that reinforces the principle meaning.'} STRICTLY NO TEXT, NO WORDS, NO LETTERS, NO LABELS. Clean background for manual text overlay.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}

SLIDE ${4 + i * 3} - "Memory ${i + 1}":
textOnSlide:
---
Remember: ${d.title}

[Create a memorable phrase, acronym, or visual mnemonic that captures the main themes from the exposition of this division. Should be catchy and help audience recall the key points.]

Example formats:
• "FAITH: Forsaking All I Trust Him"
• "3 R's of Trust: Remember, Respond, Rely"
• "The Mountain Path: Surrender → Obey → See Provision"
---
visualPrompt: Creative, memorable symbolic imagery reinforcing the memory concept. Use symbols, icons, visual patterns, or metaphors ONLY - no written words or letters. ${selectedTheme ? 'MUST use theme colors. ' : 'Use bold, memorable colors.'} Rule of Thirds. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO MNEMONIC TEXT IN IMAGE.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}

SLIDE ${5 + i * 3} - "Application ${i + 1}":
textOnSlide:
---
Application: ${d.title}

Young Professionals: [Brief question for this division]
Fathers/Mid-life: [Brief question for this division]
Elders: [Brief question for this division]
---
visualPrompt: Engaging scene showing people in life situations relevant to this division. People in natural poses and settings. Rule of Thirds to create dynamic composition. ${selectedTheme ? 'MUST use theme colors. ' : 'Warm, relatable colors and natural lighting.'} NO TEXT, NO WORDS, NO SIGNS, NO LABELS. Background image only.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}`).join('')}

SLIDE ${3 + divisionCount * 3} - "Discussion":
textOnSlide:
---
Discussion Questions

1. [Question 1 related to main theme - challenging for all age groups]
2. [Question 2 for personal reflection]
3. [Question 3 for group sharing - encouraging interaction]
---
visualPrompt: Community/gathering imagery showing people in discussion circles or group settings. Welcoming atmosphere. Rule of Thirds. ${selectedTheme ? 'MUST use theme colors and mood. ' : 'Welcoming colors and warm lighting.'} NO TEXT, NO WORDS, NO LETTERS. Clean background for question overlay.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}

SLIDE ${4 + divisionCount * 3} - "Summary":
textOnSlide:
---
Key Takeaways

✓ [Main point 1]
✓ [Main point 2]
✓ [Main point 3]

"[Memorable closing quote or principle]"
---
visualPrompt: Inspiring imagery reinforcing the main message. Scene of completion, hope, or triumph. Rule of Thirds composition. ${selectedTheme ? 'MUST use theme colors and mood. ' : 'Uplifting colors and lighting that create a sense of completion and hope.'} ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO QUOTES IN IMAGE. Background only.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "...", "text": "NONE - text-free background"}

${selectedTheme ? `
FINAL REMINDER: You MUST use the selected theme (${selectedTheme.name}) for ALL slides.
- Color Palette: ${selectedTheme.colorPalette?.map((c: any) => c.hex).join(', ') || 'from theme'}
- Mood: ${selectedTheme.mood}
- Visual Style: ${selectedTheme.visualStyle}
- Lighting: ${selectedTheme.lighting}
- CRITICAL: ALL slides must specify "NO TEXT, NO WORDS, NO LETTERS"

DO NOT deviate. EVERY slide must be consistent with this theme.
` : ''}

=== OUTPUT FORMAT ===
Return JSON array with ${totalSlides} slides:
[
  {
    "id": "slide_1",
    "slideSection": "Title",
    "slideNumber": 1,
    "textOnSlide": "...",
    "visualPrompt": "...",
    "style": {"mood": "...", "colors": ["#..."], "composition": "...", "lighting": "...", "text": "NONE"},
    "notes": "Background image only - no text rendered"
  }
]

MANDATORY: Return ALL ${totalSlides} slides with correct slideSection names!

${selectedTheme ? `
QUALITY CHECK: Before returning the response, verify that:
1. ALL slides use colors from the theme palette (${selectedTheme.colorPalette?.map((c: any) => c.hex).join(', ')})
2. ALL slides have the theme mood: ${selectedTheme.mood}
3. ALL slides follow the theme visual style: ${selectedTheme.visualStyle}
4. ALL slides use the theme lighting style: ${selectedTheme.lighting}
5. ALL visualPrompts explicitly state "NO TEXT, NO WORDS, NO LETTERS"
6. NO slide attempts to render text in the background image

If any slide deviates from these requirements, correct it before returning.
` : `
QUALITY CHECK: Before returning the response, verify that:
1. ALL visualPrompts explicitly state "NO TEXT, NO WORDS, NO LETTERS"
2. NO slide attempts to render text, words, or typography in the image
3. ALL backgrounds are suitable for manual text overlay

If any slide has text in the visualPrompt or style, correct it before returning.`}
    `.trim();
  }

  private buildWorshipSongPrompt(options: GenerationOptions): string {
    const phase1 = options.context?.phase1Selection;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);

    return `
Suggest worship songs that complement this lecture theme.

${languageInstruction}

LECTURE AIM:
${phase1?.aim || 'Not specified'}

DIVISIONS & PRINCIPLES:
${phase1?.divisions?.map((d, i) => `
${i + 1}. ${d.title}: ${d.principle}
`).join('\n') || 'Not specified'}

Suggest 3-5 songs with:
1. Song title and artist/source
2. Category (adoration, praise, thanksgiving, commitment, response, communion)
3. Key lyrics that fit the theme
4. Thematic connection to the lesson
5. Placement (opening, response, closing)

Format as JSON:
{
  "id": "song_1",
  "title": "...",
  "artist": "...",
  "source": "...",
  "category": "praise",
  "keyLyrics": ["...", "..."],
  "thematicConnection": "...",
  "placement": "opening",
  "duration": 4
}
    `.trim();
  }

  private buildApplicationPrompt(
    division: any,
    ageGroup: 'youngProfessionals' | 'fathersMidLife' | 'elders',
    context?: any
  ): string {
    const language = context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);

    const contextMap = {
      youngProfessionals: {
        label: 'Young Professionals (20s-30s)',
        focus: 'career decisions, relationships, faith in workplace, building integrity',
        examples: 'workplace ethics, dating/courtship, investing, career vs calling, balancing ambition and faith',
      },
      fathersMidLife: {
        label: 'Fathers / Mid-life (40s-50s)',
        focus: 'parenting teen/adult children, marriage, providing, spiritual leadership at home',
        examples: 'empty nest, helping children find their path, marriage re-engagement, mentoring next generation',
      },
      elders: {
        label: 'Elders (60s+)',
        focus: 'legacy, grandchildren, finishing well, mentoring, faith after loss',
        examples: 'health transitions, sharing wisdom, spiritual inheritance, contentment in later years',
      },
    };

    const ageGroupInfo = contextMap[ageGroup];
    const lectureContext = context?.phase1Selection || {};

    return `
Generate a reflective application question for this biblical passage.

${languageInstruction}

DIVISION:
Title: ${division.title}
Scripture: ${division.scriptureRange}
Principle: ${division.principle_text || division.principle}

OVERALL LECTURE AIM:
${lectureContext.aim || 'Not specified'}

TARGET AUDIENCE:
${ageGroupInfo.label}

Life Context Focus:
They are dealing with ${ageGroupInfo.focus}

Examples of relevant life situations:
${ageGroupInfo.examples}

INSTRUCTIONS:
1. Create ONE open-ended application question
2. The question should ${ageGroupInfo.focus}
3. Make it personal and reflective
4. Help them connect the biblical principle to their daily life
5. The question should prompt personal reflection, not just factual recall

Return ONLY the question text, formatted as a complete sentence. Do not include any introduction, explanation, or JSON formatting. Just the question.

Example format:
"In your current situation at work, how might this principle about God's provision change the way you approach your next difficult decision?"
    `.trim();
  }

  private parseApplicationResponse(response: string): string {
    // Extract just the question text, stripping any formatting
    let extracted = response.trim();

    // Remove common prefixes
    extracted = extracted.replace(/^(Question:|Application:|Reflection:)\s*/i, '');

    // Remove any JSON formatting if present
    extracted = extracted.replace(/^{|"question":\s*"|"|\s*}$/g, '');

    // Remove markdown formatting
    extracted = extracted.replace(/^["']|["']$/g, '');
    extracted = extracted.replace(/\*\*/g, '');

    return extracted;
  }

  private async callAI(prompt: string, maxTokens: number): Promise<string> {
    if (!this.provider) {
      throw new Error('No AI provider configured');
    }

    if (this.provider.id === 'openai') {
      return this.callOpenAI(prompt, maxTokens);
    } else if (this.provider.id === 'anthropic') {
      return this.callAnthropic(prompt, maxTokens);
    } else if (this.provider.id === 'gemini') {
      return this.callGemini(prompt, maxTokens);
    } else {
      throw new Error(`Unsupported AI provider: ${this.provider.id}`);
    }
  }

  private async callOpenAI(prompt: string, maxTokens: number): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model.id,
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: this.model.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: The AI request took longer than 3 minutes');
      }
      throw error;
    }
  }

  private async callAnthropic(prompt: string, maxTokens: number): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.model.id,
          max_tokens: maxTokens,
          temperature: this.model.temperature,
          system: this.getSystemPrompt(),
          messages: [
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data.content[0]?.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: The AI request took longer than 3 minutes');
      }
      throw error;
    }
  }

  private async callGemini(prompt: string, maxTokens: number): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model.id}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: this.getSystemPrompt() + '\n\n' + prompt }],
              },
            ],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: this.model.temperature,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: The AI request took longer than 3 minutes');
      }
      throw error;
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert BSF (Bible Study Fellowship) Teaching Assistant and Homiletics Strategist. 
Your goal is to co-create lectures specifically for an audience defined by the user in settings.

Core Characteristics:
- Theological Depth: Adhere strictly to the provided biblical text
- Cultural Context: Tone, examples, and applications should be tailored to the target audience specified in the settings
- Workflow Adherence: Act as an agent. Do NOT generate full content immediately. Execute workflow in strict phases.

Always respond with valid JSON format as requested.`;
  }

  private parsePhase1Response(response: string): StrategicFoundation[] {
    try {
      // Remove markdown code fences
      const cleanResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Handle wrapped response: { options: [...] } or { data: [...] }
      if (parsed.options && Array.isArray(parsed.options)) {
        return parsed.options;
      }
      if (parsed.data && Array.isArray(parsed.data)) {
        return parsed.data;
      }
      
      // Direct array
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // Single object - wrap in array
      return [parsed];
    } catch (e) {
      console.error('Failed to parse Phase 1 response:', e);
      // Try to find JSON array in response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.options && Array.isArray(parsed.options)) {
            return parsed.options;
          }
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (arrErr) {
          console.error('Array parse failed:', arrErr);
        }
      }
      return [];
    }
  }

  private parsePhase2Response(response: string): NarrativeArc[] {
    // Remove markdown code fences
    const cleanResponse = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    try {
      const parsed = JSON.parse(cleanResponse);
      
      // Handle wrapped response: { stories: [...] } or { data: [...] }
      if (parsed.stories && Array.isArray(parsed.stories)) {
        return parsed.stories;
      }
      if (parsed.data && Array.isArray(parsed.data)) {
        return parsed.data;
      }
      if (parsed.options && Array.isArray(parsed.options)) {
        return parsed.options;
      }
      
      // Direct array
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // Single object - wrap in array
      return [parsed];
    } catch (e) {
      console.error('Phase 2 parse failed:', e instanceof Error ? e.message : e);
      // Return empty array instead of throwing to allow retry
      return [];
    }
  }

  private parsePhase3Response(response: string): Lecture {
    console.log('[Phase3] Raw response length:', response.length);
    console.log('[Phase3] Response preview (first 500 chars):', response.substring(0, 500));
    console.log('[Phase3] Response preview (last 500 chars):', response.substring(response.length - 500));
    
    try {
      // Try to extract JSON from markdown code blocks first
      let jsonText = response;
      
      // Check for markdown code blocks
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        console.log('[Phase3] Found markdown code block, extracting content');
        jsonText = codeBlockMatch[1];
      }
      
      // Find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Phase3] No JSON object found in response');
        throw new Error('No JSON found in response');
      }
      
      console.log('[Phase3] Extracted JSON length:', jsonMatch[0].length);
      
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[Phase3] Parsed keys:', Object.keys(parsed));
      
      // Handle case where AI wraps lecture in "lecture" field
      if (parsed.lecture && typeof parsed.lecture === 'object') {
        console.log('[Phase3] Found wrapped in "lecture" field');
        return parsed.lecture;
      }
      
      // Handle case where AI wraps lecture in "lecture_manuscript" field
      if (parsed.lecture_manuscript) {
        console.log('[Phase3] Found wrapped in "lecture_manuscript" field');
        return parsed.lecture_manuscript;
      }
      
      // Handle case where metadata is at top level but body is nested
      if (parsed.metadata && parsed.introduction && parsed.body) {
        console.log('[Phase3] Found flat structure with metadata');
        return parsed;
      }
      
      // If parsed has the expected fields, return it
      if (parsed.title || parsed.metadata) {
        console.log('[Phase3] Found lecture with title/metadata');
        return parsed;
      }
      
      console.error('[Phase3] Invalid structure - missing required fields. Keys found:', Object.keys(parsed));
      throw new Error('Invalid lecture structure');
    } catch (e) {
      console.error('[Phase3] Parse error:', e instanceof Error ? e.message : e);
      console.error('[Phase3] Full response excerpt:', response.substring(0, 1000));
      throw new Error('Failed to generate lecture');
    }
  }

  private parsePhase4Response(response: string): VisualAsset[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      let slides: VisualAsset[] = [];
      
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]);
      } else {
        const parsed = JSON.parse(response);
        slides = Array.isArray(parsed) ? parsed : [parsed];
      }

      // Validate mandatory slides exist
      const mandatorySections = ['Title', 'Outline', 'Application'];
      const existingSections = slides.map(s => s.slideSection);
      
      for (const section of mandatorySections) {
        if (!existingSections.includes(section)) {
          console.warn(`Missing mandatory slide: ${section}`);
        }
      }

      // Ensure slides have required fields
      return slides.map((slide, index) => ({
        id: slide.id || `slide_${index + 1}`,
        slideSection: slide.slideSection || `Slide ${index + 1}`,
        slideNumber: slide.slideNumber || index + 1,
        textOnSlide: slide.textOnSlide || '',
        visualPrompt: slide.visualPrompt || '',
        style: slide.style || {
          mood: 'reflective',
          colors: ['#3B82F6', '#10B981'],
          composition: 'centered',
          lighting: 'soft'
        },
        notes: slide.notes || ''
      }));
    } catch (e) {
      console.error('Failed to parse Phase 4 response:', e);
      return [];
    }
  }

  private parseDesignThemesResponse(response: string): any[] {
    try {
      // Remove markdown code fences
      const cleanResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      let themes: any[] = [];
      
      if (jsonMatch) {
        themes = JSON.parse(jsonMatch[0]);
      } else {
        const parsed = JSON.parse(cleanResponse);
        themes = Array.isArray(parsed) ? parsed : [parsed];
      }

      // Ensure themes have required fields
      return themes.map((theme, index) => ({
        id: theme.id || `theme_${index + 1}`,
        name: theme.name || `Theme ${index + 1}`,
        description: theme.description || '',
        colorPalette: theme.colorPalette || [
          { name: 'Primary', hex: '#3B82F6' },
          { name: 'Secondary', hex: '#10B981' },
          { name: 'Accent', hex: '#F59E0B' }
        ],
        mood: theme.mood || 'reflective',
        visualStyle: theme.visualStyle || 'photographic',
        lighting: theme.lighting || 'soft natural light',
        typography: theme.typography || 'elegant serif',
        rationale: theme.rationale || ''
      }));
    } catch (e) {
      console.error('Failed to parse design themes response:', e);
      return [];
    }
  }

  private parseWorshipSongResponse(response: string): WorshipSong[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error('Failed to parse worship song response:', e);
      return [];
    }
  }
}

export const aiService = new AIService();
