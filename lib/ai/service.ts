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
    
    if (anthropicKey && config) {
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
    const response = await this.callAI(prompt, 15000);
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
    const response = await this.callAI(prompt, 1500);
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
    
    return `
Analyze the following biblical text and generate ${optionsCount} distinct options for the Overall Aim and Divisional Principles.

${languageInstruction}

TEXT:
${options.text}

For each option, provide:
1. **Aim:** A single sentence summary of the lesson's goal
2. **Divisions:** Break the pericope into 2-4 logical subsections
3. **Principles:** For each division, write a complete sentence stating a universal spiritual truth about God or men in reference to God
4. **Confidence Score:** A probability percentage (0-100%) based on textual accuracy and relevance to Indonesian adult men

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
    
    const divisionsText = phase1?.divisions 
      ? phase1.divisions.map(d => `- ${d.title}: ${d.principle}`).join('\n')
      : 'Not specified';

    return `
Based on the selected Strategic Foundation, generate ${optionsCount} distinct "Bookend Story" options for a lecture.

${languageInstruction}

SELECTED AIM:
${phase1?.aim || 'Not specified'}

DIVISIONS:
${divisionsText}

Generate stories that:
1. Create empathy and engagement with Indonesian men
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

STRUCTURE (concise, avoid repetition):
1. **Introduction (400-500 words):** Tell the opening part of the story ${langSpecific}, ending with the cliffhanger. Set biblical context briefly but thoroughly.
2. **Body (300-400 words per division):** For each of 3 divisions:
   - Exposition: Context and text explanation with depth (3-4 sentences)
   - Principle: State the principle naturally (1-2 sentences)
   - Application: 2-3 questions per age group (provide substance)
3. **Conclusion (400-500 words):** Resolve the story ${langSpecific}, connect to aim with warmth, meaningful closing prayer

IMPORTANT: Each section should be substantial and complete. Avoid repeating concepts across sections but ensure thorough coverage.

Format as JSON with the full lecture content ${langSpecific}.
    `.trim();
  }

  private buildDesignThemesPrompt(options: GenerationOptions): string {
    const phase1 = options.context?.phase1Selection;
    const lecture = options.context?.phase3Lecture;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);
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
Indonesian adult men (young professionals, fathers/mid-life, elders)
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

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY ${totalSlides} slides
2. Each slide MUST be 16:9 aspect ratio (1920x1080 landscape)
3. Slides MUST be in this EXACT order with these EXACT slideSection names:

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

FOR EACH SLIDE, include these DESIGN ELEMENTS in the visualPrompt:
- colors: Specify 2-3 hex color codes that match the mood (e.g., ["#1E3A8A", "#F59E0B"])
- composition: Use "Rule of Thirds" or "centered" or "asymmetrical balance"
- mood: Choose from: dramatic, peaceful, triumphant, reflective, hopeful
- lighting: Describe lighting (e.g., "soft natural light", "dramatic backlighting", "warm golden hour")

SLIDE 1 - "Title":
textOnSlide:
---
[LECTURE TITLE]
[Scripture Reference]
BSF Lecture
---
visualPrompt: Elegant background with imagery reflecting the lecture theme. Use Rule of Thirds composition. Include specific colors that match the theme's mood.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "..."}

SLIDE 2 - "Outline":
textOnSlide:
---
Outline

I. [Division 1 Title] ([Scripture])
II. [Division 2 Title] ([Scripture])
III. [Division 3 Title] ([Scripture])
---
visualPrompt: Clean minimalist design for text readability. Use Rule of Thirds to position text. Soft, professional colors.
style: {"mood": "peaceful", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "soft even lighting"}
${divisions.map((d, i) => `
SLIDE ${3 + i * 3} - "Principle ${i + 1}":
textOnSlide:
---
${d.title}
"${d.principle}"
---
visualPrompt: Visual metaphor that symbolizes this principle memorably. Use Rule of Thirds composition. Include specific color palette and dramatic or peaceful lighting that reinforces the principle's meaning.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "..."}

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
visualPrompt: Creative, memorable imagery that reinforces the memory aid. Use symbols, icons, or visual patterns that connect to the mnemonic. Apply Rule of Thirds. Use bold, memorable colors.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "..."}

SLIDE ${5 + i * 3} - "Application ${i + 1}":
textOnSlide:
---
Application: ${d.title}

Young Professionals: [Brief question for this division]
Fathers/Mid-life: [Brief question for this division]
Elders: [Brief question for this division]
---
visualPrompt: Engaging image showing people in life situations relevant to this division. Use Rule of Thirds to create dynamic composition. Warm, relatable colors and natural lighting.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "..."}`).join('')}

SLIDE ${3 + divisionCount * 3} - "Discussion":
textOnSlide:
---
Discussion Questions

1. [Question 1 related to main theme - challenging for all age groups]
2. [Question 2 for personal reflection]
3. [Question 3 for group sharing - encouraging interaction]
---
visualPrompt: Community/gathering imagery with space for questions. Use Rule of Thirds. Welcoming colors and warm lighting.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "..."}

SLIDE ${4 + divisionCount * 3} - "Summary":
textOnSlide:
---
Key Takeaways

✓ [Main point 1]
✓ [Main point 2]
✓ [Main point 3]

" [Memorable closing quote or principle]"
---
visualPrompt: Inspiring image that reinforces the main message. Use Rule of Thirds composition. Uplifting colors and lighting that create a sense of completion and hope.
style: {"mood": "...", "colors": ["#...", "#..."], "composition": "Rule of Thirds", "lighting": "..."}

=== OUTPUT FORMAT ===
Return JSON array with ${totalSlides} slides:
[
  {
    "id": "slide_1",
    "slideSection": "Title",
    "slideNumber": 1,
    "textOnSlide": "...",
    "visualPrompt": "...",
    "style": {"mood": "...", "colors": ["#..."], "composition": "...", "lighting": "..."},
    "notes": "..."
  }
]

MANDATORY: Return ALL ${totalSlides} slides with correct slideSection names!
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

  private getSystemPrompt(): string {
    return `You are an expert BSF (Bible Study Fellowship) Teaching Assistant and Homiletics Strategist. 
Your goal is to co-create lectures specifically for an audience of Indonesian adult men.

Core Characteristics:
- Theological Depth: Adhere strictly to the provided biblical text
- Cultural Context: Tone, examples, and applications must resonate with Indonesian culture (communal responsibility, fatherhood, leadership, workplace integrity, respect)
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
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Handle case where AI wraps lecture in "lecture" field
      if (parsed.lecture && typeof parsed.lecture === 'object') {
        return parsed.lecture;
      }
      
      // Handle case where AI wraps lecture in "lecture_manuscript" field
      if (parsed.lecture_manuscript) {
        return parsed.lecture_manuscript;
      }
      
      // Handle case where metadata is at top level but body is nested
      if (parsed.metadata && parsed.introduction && parsed.body) {
        return parsed;
      }
      
      // If parsed has the expected fields, return it
      if (parsed.title || parsed.metadata) {
        return parsed;
      }
      
      throw new Error('Invalid lecture structure');
    } catch (e) {
      console.error('Failed to parse Phase 3 response:', e instanceof Error ? e.message : e);
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
