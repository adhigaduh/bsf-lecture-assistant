'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  WorkflowState, 
  WorkflowPhase, 
  StrategicFoundation, 
  NarrativeArc, 
  Lecture,
  VisualAsset,
  WorshipSong,
  WorkflowSettings
} from '@/types/workflow';

interface WorkflowStore extends WorkflowState {
  setUploadedText: (text: string, fileName: string) => void;
  clearUploadedText: () => void;
  setPhase1Options: (options: StrategicFoundation[]) => void;
  selectPhase1Option: (option: StrategicFoundation) => void;
  setPhase1Generating: (isGenerating: boolean, error?: string) => void;
  setPhase2Options: (options: NarrativeArc[]) => void;
  selectPhase2Option: (option: NarrativeArc) => void;
  setPhase2Generating: (isGenerating: boolean, error?: string) => void;
  setLecture: (lecture: Lecture | null) => void;
  clearLecture: () => void;
  setWorshipSongs: (songs: WorshipSong[]) => void;
  setPhase3Generating: (isGenerating: boolean, progress?: number, error?: string) => void;
  setVisualAssets: (assets: VisualAsset[]) => void;
  setPhase4Generating: (isGenerating: boolean, error?: string) => void;
  setCurrentPhase: (phase: WorkflowPhase) => void;
  nextPhase: () => void;
  previousPhase: () => void;
  canProceedToPhase: (phase: WorkflowPhase) => boolean;
  updateSettings: (settings: Partial<WorkflowSettings>) => void;
  resetWorkflow: () => void;
  resetPhase: (phase: WorkflowPhase) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const initialState: WorkflowState = {
  currentPhase: 1,
  uploadedText: '',
  extractedText: '',
  fileName: '',
  phase1: {
    options: [],
    selected: null,
    isGenerating: false,
    error: null,
  },
  phase2: {
    options: [],
    selected: null,
    isGenerating: false,
    error: null,
  },
  phase3: {
    lecture: null,
    worshipSongs: [],
    isGenerating: false,
    error: null,
    progress: 0,
  },
  phase4: {
    visualAssets: [],
    isGenerating: false,
    error: null,
  },
  settings: {
    language: 'en',
    aiProvider: 'anthropic',
    aiModel: 'claude-3-5-sonnet-20241022',
    quickMode: false,
    autoSave: true,
  },
};

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUploadedText: (text: string, fileName: string) => {
        set({ 
          uploadedText: text, 
          extractedText: text,
          fileName 
        });
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      clearUploadedText: () => {
        set({ 
          uploadedText: '', 
          extractedText: '',
          fileName: '' 
        });
      },

      setPhase1Options: (options: StrategicFoundation[]) => {
        set((state) => ({
          phase1: { ...state.phase1, options }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      selectPhase1Option: (option: StrategicFoundation) => {
        set((state) => ({
          phase1: { ...state.phase1, selected: option }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      setPhase1Generating: (isGenerating: boolean, error?: string) => {
        set((state) => ({
          phase1: { ...state.phase1, isGenerating, error: error || null }
        }));
      },

      setPhase2Options: (options: NarrativeArc[]) => {
        set((state) => ({
          phase2: { ...state.phase2, options }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      selectPhase2Option: (option: NarrativeArc) => {
        set((state) => ({
          phase2: { ...state.phase2, selected: option }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      setPhase2Generating: (isGenerating: boolean, error?: string) => {
        set((state) => ({
          phase2: { ...state.phase2, isGenerating, error: error || null }
        }));
      },

      setLecture: (lecture: Lecture | null) => {
        set((state) => ({
          phase3: { ...state.phase3, lecture }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      clearLecture: () => {
        set((state) => ({
          phase3: { ...state.phase3, lecture: null }
        }));
      },

      setWorshipSongs: (songs: WorshipSong[]) => {
        set((state) => ({
          phase3: { ...state.phase3, worshipSongs: songs }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      setPhase3Generating: (isGenerating: boolean, progress = 0, error?: string) => {
        set((state) => ({
          phase3: { ...state.phase3, isGenerating, progress, error: error || null }
        }));
      },

      setVisualAssets: (assets: VisualAsset[]) => {
        set((state) => ({
          phase4: { ...state.phase4, visualAssets: assets }
        }));
        if (get().settings.autoSave) {
          get().saveToLocalStorage();
        }
      },

      setPhase4Generating: (isGenerating: boolean, error?: string) => {
        set((state) => ({
          phase4: { ...state.phase4, isGenerating, error: error || null }
        }));
      },

      setCurrentPhase: (phase: WorkflowPhase) => {
        set({ currentPhase: phase });
      },

      nextPhase: () => {
        const current = get().currentPhase;
        if (current < 4) {
          set({ currentPhase: (current + 1) as WorkflowPhase });
        }
      },

      previousPhase: () => {
        const current = get().currentPhase;
        if (current > 1) {
          set({ currentPhase: (current - 1) as WorkflowPhase });
        }
      },

      canProceedToPhase: (phase: WorkflowPhase): boolean => {
        const state = get();
        
        switch (phase) {
          case 2:
            // To go to Strategy (Phase 2), need text uploaded from Phase 1
            return state.uploadedText !== null && state.uploadedText.length > 0;
          case 3:
            // To go to Narrative (Phase 3), need Strategy option selected (phase1 in store)
            return state.phase1.selected !== null;
          case 4:
            // To go to Lecture (Phase 4), need Narrative option selected (phase2 in store)
            return state.phase2.selected !== null;
          case 5:
            // To go to Visuals (Phase 5), need lecture generated
            return state.phase3.lecture !== null;
          default:
            return false;
        }
      },

      updateSettings: (newSettings: Partial<WorkflowSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      resetWorkflow: () => {
        set(initialState);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bsf-lecture-workflow');
        }
      },

      resetPhase: (phase: WorkflowPhase) => {
        switch (phase) {
          case 1:
            set((state) => ({
              phase1: { ...initialState.phase1 }
            }));
            break;
          case 2:
            set((state) => ({
              phase2: { ...initialState.phase2 },
              currentPhase: 1
            }));
            break;
          case 3:
            set((state) => ({
              phase3: { ...initialState.phase3 },
              currentPhase: 2
            }));
            break;
          case 4:
            set((state) => ({
              phase4: { ...initialState.phase4 },
              currentPhase: 3
            }));
            break;
        }
      },

      saveToLocalStorage: () => {
        if (typeof window !== 'undefined') {
          const state = get();
          const savedState = {
            currentPhase: state.currentPhase,
            uploadedText: state.uploadedText,
            extractedText: state.extractedText,
            fileName: state.fileName,
            phase1: state.phase1,
            phase2: state.phase2,
            phase3: state.phase3,
            phase4: state.phase4,
            settings: state.settings,
          };
          localStorage.setItem('bsf-lecture-workflow', JSON.stringify(savedState));
        }
      },

      loadFromLocalStorage: () => {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('bsf-lecture-workflow');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && typeof parsed.uploadedText === 'string') {
                // Check for corrupted data and clear if needed
                if (parsed.uploadedText.includes('BT') || parsed.uploadedText.includes('ET') || 
                    parsed.uploadedText.length < 20) {
                  console.log('Clearing old garbled data from localStorage');
                  localStorage.removeItem('bsf-lecture-workflow');
                  return;
                }
                // Valid data - load it
                set({ ...initialState, ...parsed });
              }
            } catch (e) {
              console.error('Failed to load saved workflow:', e);
            }
          }
        }
      },
    }),
    {
      name: 'bsf-lecture-workflow',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentPhase: state.currentPhase,
        uploadedText: state.uploadedText,
        extractedText: state.extractedText,
        fileName: state.fileName,
        phase1: state.phase1,
        phase2: state.phase2,
        phase3: state.phase3,
        phase4: state.phase4,
        settings: state.settings,
      }),
    }
  )
);
