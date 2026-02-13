// BSF Lecture Assistant - TypeScript Type Definitions

export type WorkflowPhase = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  description: string;
  lectureData: WorkflowState;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowState {
  currentUser: User | null;
  currentDocumentId: string | null;
  documents: Document[];
  currentPhase: WorkflowPhase;
  uploadedText: string;
  extractedText: string;
  fileName: string;
  phase1: Phase1State;
  phase2: Phase2State;
  phase3: Phase3State;
  phase4: Phase4State;
  settings: WorkflowSettings;
}

export interface WorkflowSettings {
  language: 'en' | 'id';
  aiProvider: string;
  aiModel: string;
  quickMode: boolean;
  autoSave: boolean;
}

export interface Phase1State {
  options: StrategicFoundation[];
  selected: StrategicFoundation | null;
  isGenerating: boolean;
  error: string | null;
}

export interface StrategicFoundation {
  id: string;
  aim: string;
  divisions: Division[];
  confidenceScore: number;
  reasoning: string;
}

export interface Division {
  id: string;
  title: string;
  scriptureRange: string;
  principle: string;
  keyVerses: string[];
}

export interface Phase2State {
  options: NarrativeArc[];
  selected: NarrativeArc | null;
  isGenerating: boolean;
  error: string | null;
}

export interface NarrativeArc {
  id: string;
  title: string;
  tone: 'historical' | 'personal' | 'contemporary' | 'biblical';
  opening: string;
  cliffhanger: string;
  resolution: string;
  resonanceScore: number;
  characters: Character[];
  setting: StorySetting;
}

export interface Character {
  name: string;
  role: string;
  description: string;
}

export interface StorySetting {
  time: string;
  place: string;
  context: string;
}

export interface Phase3State {
  lecture: Lecture | null;
  worshipSongs: WorshipSong[];
  isGenerating: boolean;
  error: string | null;
  progress: number;
}

export interface Lecture {
  id: string;
  title: string;
  scriptureReference: string;
  introduction: IntroductionSection;
  body: LectureDivision[];
  conclusion: ConclusionSection;
  metadata: LectureMetadata;
}

export interface IntroductionSection {
  storyOpening: string;
  cliffhanger: string;
  transitionToText: string;
}

export interface LectureDivision {
  id: string;
  title: string;
  scriptureRange: string;
  exposition: string;
  principle: string;
  applications: AgeGroupApplications;
  transitions: string;
}

export interface AgeGroupApplications {
  youngProfessionals: ApplicationQuestion;
  fathersMidLife: ApplicationQuestion;
  elders: ApplicationQuestion;
}

export interface ApplicationQuestion {
  question: string;
  discussionPoints: string[];
  reflectionTime: number;
}

export interface ConclusionSection {
  storyResolution: string;
  callToAction: string;
  closingPrayer: string;
  finalThought: string;
}

export interface LectureMetadata {
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  version: string;
}

export interface Phase4State {
  visualAssets: VisualAsset[];
  isGenerating: boolean;
  error: string | null;
}

export interface VisualAsset {
  id: string;
  slideSection: string;
  slideNumber: number;
  textOnSlide: string;
  visualPrompt: string;
  style: VisualStyle;
  notes: string;
}

export interface VisualStyle {
  mood: 'dramatic' | 'peaceful' | 'triumphant' | 'reflective' | 'hopeful';
  colors: string[];
  composition: string;
  lighting: string;
}

export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  source: string;
  category: 'adoration' | 'praise' | 'thanksgiving' | 'commitment' | 'response' | 'communion';
  keyLyrics: string[];
  thematicConnection: string;
  placement: 'opening' | 'response' | 'closing' | '贯穿';
  duration: number;
}

export type ExportFormat = 'markdown' | 'pdf' | 'docx' | 'google_docs' | 'pptx' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeVisualAssets: boolean;
  includeWorshipSongs: boolean;
  includeApplications: boolean;
  branding: boolean;
  fileName?: string;
}

export interface GenerateRequest {
  phase: WorkflowPhase;
  text: string;
  context?: {
    phase1Selection?: StrategicFoundation;
    phase2Selection?: NarrativeArc;
    previousSelections?: Record<string, unknown>;
  };
  settings?: Partial<WorkflowSettings>;
}

export interface GenerateResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  id: string;
  enabled: boolean;
  models: AIModel[];
  env_var?: string;
  base_url?: string;
  local_only?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  max_tokens: number;
  temperature: number;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
}

export interface PhaseConfig {
  name: string;
  description: string;
  max_output_tokens: number;
}

export interface AppConfig {
  app: {
    name: string;
    version: string;
    description: string;
    language: {
      default: string;
      options: Array<{
        code: string;
        name: string;
        display: string;
      }>;
    };
    theme: {
      primary_color: string;
      secondary_color: string;
      accent_color: string;
      font_family: string;
    };
  };
  ai_providers: {
    active: string;
    providers: AIProvider[];
  };
  workflow: {
    options_count: number;
    confidence_thresholds: {
      high: number;
      medium: number;
      low: number;
    };
    phases: Record<string, PhaseConfig>;
    quick_mode: {
      enabled: boolean;
      skip_options: boolean;
      auto_select: string;
      bypass_story_phase: boolean;
    };
  };
  storage: {
    local: {
      enabled: boolean;
      base_directory: string;
      formats: string[];
    };
    auto_save: {
      enabled: boolean;
      interval_seconds: number;
      max_backups: number;
    };
  };
  google_docs?: {
    enabled: boolean;
    oauth: {
      client_id: string;
      client_secret: string;
      redirect_uri: string;
      scopes: string[];
    };
    templates: {
      default: {
        font_family: string;
        title_size: number;
        heading_size: number;
        body_size: number;
        margins: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
      };
    };
  };
  features: Record<string, boolean>;
}

export interface UIState {
  sidebarOpen: boolean;
  activeTab: 'workflow' | 'preview' | 'export' | 'settings';
  isLoading: boolean;
  toast: Toast | null;
  modal: Modal | null;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'form' | 'custom';
  title: string;
  content: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}
