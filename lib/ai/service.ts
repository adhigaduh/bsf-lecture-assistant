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

  async generateVisualAssets(options: GenerationOptions): Promise<VisualAsset[]> {
    if (!this.provider) {
      throw new Error('No AI provider configured.');
    }
    const prompt = this.buildPhase4Prompt(options);
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

  private buildPhase4Prompt(options: GenerationOptions): string {
    const phase1 = options.context?.phase1Selection;
    const lecture = options.context?.phase3Lecture;
    const language = options.context?.settings?.language || 'en';
    const languageInstruction = this.getLanguageInstruction(language);

    const lectureText = lecture ? `
INTRODUCTION STORY: ${lecture.introduction.storyOpening}
CONCLUSION: ${lecture.conclusion.storyResolution}` : '';

    return `
Generate visual asset prompts for presentation slides based on this lecture.

${languageInstruction}

LECTURE AIM:
${phase1?.aim || 'Not specified'}

${lecture ? `LECTURE CONTEXT:
${lectureText}` : ''}

DIVISIONS:
${phase1?.divisions?.map((d, i) => `
${i + 1}. ${d.title}
   Principle: ${d.principle}
`).join('\n') || 'Not specified'}

Generate visual prompts for these slides:
- Title slide (introductory visual that captures the overall theme)
- Each division section (visual that illustrates the section's principle)
- Conclusion slide (summarizing visual that reinforces the main aim)

For each slide, provide:
1. textOnSlide: 1-2 sentences with the key text to display
2. visualPrompt: A detailed description for AI image generation (100-150 words) that creates a meaningful visual metaphor without being cheesy. Use symbolism, color theory, and composition thoughtfully.
3. style: mood, color palette (2-3 hex codes), composition style, lighting

Return as JSON array:
[
  {
    "id": "slide_1",
    "slideSection": "Title",
    "slideNumber": 1,
    "textOnSlide": "...",
    "visualPrompt": "...",
    "style": {
      "mood": "hopeful",
      "colors": ["#3B82F6", "#10B981"],
      "composition": "minimalist",
      "lighting": "warm"
    },
    "notes": "Design rationale..."
  }
]
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
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error('Failed to parse Phase 4 response:', e);
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
