'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  BookOpen, 
  Image,
  RotateCcw,
  ChevronRight
} from 'lucide-react';

const PHASE_CONFIG = [
  { id: 1, name: 'Upload', icon: FileText, component: 'FileUploader' },
  { id: 2, name: 'Strategy', icon: BookOpen, component: 'Phase1StrategicFoundation' },
  { id: 3, name: 'Narrative', icon: Sparkles, component: 'Phase2NarrativeArc' },
  { id: 4, name: 'Lecture', icon: Image, component: 'Phase3LectureGeneration' },
];

export function WorkflowStatus() {
  const workflowState = useWorkflowStore();
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    const hasExistingWork = 
      workflowState.uploadedText.length > 0 ||
      workflowState.phase1.options.length > 0 ||
      workflowState.phase2.options.length > 0 ||
      workflowState.phase3.lecture !== null ||
      workflowState.phase4.visualAssets.length > 0;
    
    setShowResume(hasExistingWork);
  }, [workflowState]);

  const getPhaseStatus = (phaseId: number) => {
    switch (phaseId) {
      case 1:
        return {
          complete: workflowState.uploadedText.length > 0,
          incomplete: workflowState.uploadedText.length === 0,
          generating: false
        };
      case 2:
        return {
          complete: workflowState.phase1.selected !== null,
          incomplete: workflowState.phase1.options.length > 0 && workflowState.phase1.selected === null,
          generating: workflowState.phase1.isGenerating
        };
      case 3:
        return {
          complete: workflowState.phase2.selected !== null,
          incomplete: workflowState.phase2.options.length > 0 && workflowState.phase2.selected === null,
          generating: workflowState.phase2.isGenerating
        };
      case 4:
        return {
          complete: workflowState.phase3.lecture !== null,
          incomplete: workflowState.phase3.lecture === null && workflowState.phase2.selected !== null,
          generating: workflowState.phase3.isGenerating
        };
      case 5:
        return {
          complete: workflowState.phase4.visualAssets.length > 0,
          incomplete: workflowState.phase3.lecture !== null && workflowState.phase4.visualAssets.length === 0,
          generating: workflowState.phase4.isGenerating
        };
      default:
        return { complete: false, incomplete: true, generating: false };
    }
  };

  const getPhaseProgress = () => {
    let progress = 0;
    if (workflowState.uploadedText.length > 0) progress += 20;
    if (workflowState.phase1.selected !== null) progress += 20;
    if (workflowState.phase2.selected !== null) progress += 20;
    if (workflowState.phase3.lecture !== null) progress += 20;
    if (workflowState.phase4.visualAssets.length > 0) progress += 20;
    return progress;
  };

  if (!showResume) return null;

  const progress = getPhaseProgress();
  const incompletePhase = PHASE_CONFIG.find(p => getPhaseStatus(p.id).incomplete);

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-yellow-600" />
            Resume Your Work
          </CardTitle>
          <Badge variant="outline" className="bg-white">
            {progress}% Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="w-full bg-yellow-200 rounded-full h-2 mb-4">
          <div 
            className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase status */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PHASE_CONFIG.map(phase => {
            const status = getPhaseStatus(phase.id);
            return (
              <div 
                key={phase.id}
                className={`text-center p-2 rounded-lg ${
                  status.complete ? 'bg-green-100 text-green-800' :
                  status.generating ? 'bg-blue-100 text-blue-800' :
                  status.incomplete ? 'bg-white border border-yellow-300 text-yellow-800' :
                  'bg-gray-50 text-gray-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {status.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : status.generating ? (
                    <Clock className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-medium">{phase.name}</p>
              </div>
            );
          })}
        </div>

        {/* Resume instruction */}
        {incompletePhase && (
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-yellow-200">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Continue from: <span className="text-yellow-700">{incompletePhase.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                Your work is saved and ready to continue
              </p>
            </div>
            <Button 
              size="sm"
              onClick={() => {
                useWorkflowStore.setState({ currentPhase: incompletePhase.id as 1 | 2 | 3 | 4 });
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Clear all */}
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-red-600"
            onClick={() => {
              if (confirm('Start a new lecture? All progress will be lost.')) {
                localStorage.removeItem('bsf-lecture-workflow');
                window.location.reload();
              }
            }}
          >
            Start New Lecture
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
