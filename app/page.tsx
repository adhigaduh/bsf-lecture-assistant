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
import { DocumentPanel } from '@/components/DocumentPanel';
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
  Sparkles,
  FolderOpen,
  User,
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
    updateSettings,
    currentUser,
    currentDocumentId,
    documents,
    saveCurrentDocument,
    logout
  } = useWorkflowStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    loadFromLocalStorage();
    updateSettings({ language: 'en' as 'en' | 'id' });
    setIsHydrated(true);
  }, [loadFromLocalStorage, updateSettings]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isHydrated && !currentUser) {
      // Check if we're not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }, [isHydrated, currentUser]);

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
            {currentDocumentId && (
              <Badge variant="outline" className="text-xs">
                {documents.find(d => d.id === currentDocumentId)?.name || 'Unknown'}
              </Badge>
            )}
          </div>
           
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDocumentPanel(!showDocumentPanel)}
              className={showDocumentPanel ? 'bg-blue-50' : ''}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Documents
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
          {/* Work Sidebar */}
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
                            if (currentUser && currentDocumentId) {
                              saveCurrentDocument();
                            }
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
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto pb-24">
            <div className="max-w-4xl mx-auto">
              <CurrentComponent />
            </div>
          </main>

          {/* Document Panel (Right Sidebar) */}
          {showDocumentPanel && (
            <aside className="w-80 bg-white border-l min-h-[calc(100vh-64px)] p-4 overflow-auto">
              <DocumentPanel />
            </aside>
          )}
        </div>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
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
            disabled={!isHydrated || !canProceedToPhase((currentPhase + 1) as WorkflowPhase)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
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
