import { useWorkflowStore } from '@/lib/workflow-store';
import { Progress } from '@/components/ui/progress';

export function ProgressBar({ currentPhase, totalPhases }: { currentPhase: number; totalPhases: number }) {
  const progress = (currentPhase / totalPhases) * 100;
  
  return (
    <div className="w-full px-4 py-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Phase {currentPhase}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
