'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { WorkflowPhase } from '@/types/workflow';
import { FileUploader } from '@/components/FileUploader';
import { Phase1StrategicFoundation } from '@/components/Phase1StrategicFoundation';
import { Phase2NarrativeArc } from '@/components/Phase2NarrativeArc';
import { Phase3LectureGeneration } from '@/components/Phase3LectureGeneration';
import { Phase4VisualAssets } from '@/components/Phase4VisualAssets';
import { WorkflowStatus } from '@/components/WorkflowStatus';
import { ProgressBar } from '@/components/ProgressBar';
import { ClientOnly } from '@/components/ClientOnly';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  BookOpen, 
  FileText, 
  Image, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const { 
    currentPhase, 
    setCurrentPhase, 
    nextPhase, 
    previousPhase,
    canProceedToPhase,
    loadFromLocalStorage,
    resetWorkflow,
    settings,
    updateSettings
  } = useWorkflowStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    loadFromLocalStorage();
    updateSettings({ language: 'en' as 'en' | 'id' });
    setIsHydrated(true);
  }, [loadFromLocalStorage, updateSettings]);

  const phases = [
    { id: 1, name: 'Upload', icon: Upload, component: FileUploader },
    { id: 2, name: 'Strategy', icon: BookOpen, component: Phase1StrategicFoundation },
    { id: 3, name: 'Narrative', icon: Sparkles, component: Phase2NarrativeArc },
    { id: 4, name: 'Lecture', icon: FileText, component: Phase3LectureGeneration },
    { id: 5, name: 'Visuals', icon: Image, component: Phase4VisualAssets },
  ];

  const phaseConfig = phases.find(p => p.id === currentPhase);
  const CurrentComponent = phaseConfig?.component || FileUploader;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">BSF Lecture Assistant</h1>
            <Badge variant="outline">{settings.language.toUpperCase()}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={resetWorkflow}>
              New Lecture
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <ProgressBar currentPhase={currentPhase} totalPhases={5} />
      </header>

      {/* Workflow Status / Resume */}
      <WorkflowStatus />

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
            {!isHydrated ? (
              <div className="p-4 text-center text-gray-500">
                <p>Loading...</p>
              </div>
            ) : (
              <nav className="space-y-2">
                {phases.map((phase) => {
                  const Icon = phase.icon;
                  const isActive = phase.id === currentPhase;
                  const isCompleted = phase.id < currentPhase;
                  const canAccess = phase.id === 1 || canProceedToPhase(phase.id as 1 | 2 | 3 | 4);
                  const isDisabled = !canAccess && !isActive;
                  
                  return (
                    <Button
                      key={phase.id}
                      variant={isActive ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      disabled={isDisabled}
                      onClick={() => {
                        if (canAccess) {
                          setCurrentPhase(phase.id as WorkflowPhase);
                        }
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {phase.name}
                      {isCompleted && (
                        <Badge variant="secondary" className="ml-auto">✓</Badge>
                      )}
                    </Button>
                  );
                })}
              </nav>
            )}

            {/* Quick Mode Toggle */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Quick Mode</h3>
              <p className="text-xs text-gray-600 mb-2">
                Skip option selection and auto-select best options
              </p>
              <Button
                variant={settings.quickMode ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => updateSettings({ quickMode: !settings.quickMode })}
              >
                {settings.quickMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <CurrentComponent />
          </div>
        </main>
      </div>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousPhase}
            disabled={currentPhase === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-gray-600">
            Phase {currentPhase} of 5
          </div>
          
          <Button
            onClick={nextPhase}
            disabled={!canProceedToPhase((currentPhase + 1) as WorkflowPhase)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          
          <div className="text-xs text-gray-400">
            canProceed({currentPhase + 1}): {canProceedToPhase((currentPhase + 1) as WorkflowPhase) ? 'true' : 'false'}
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}
