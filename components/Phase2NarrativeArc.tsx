'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, BookOpen, Clock } from 'lucide-react';
import { NarrativeArc } from '@/types/workflow';

function Timer({ isRunning, completedTime, onComplete }: { isRunning: boolean; completedTime?: number; onComplete?: () => void }) {
  const [seconds, setSeconds] = useState(completedTime ? Math.round(completedTime / 1000) : 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          const newSeconds = s + 1;
          if (onComplete && newSeconds > 300) {
            onComplete();
          }
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onComplete]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${isRunning ? 'text-blue-600' : 'text-gray-600'}`}>
      <Clock className="h-4 w-4" />
      <span>{mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  );
}

export function Phase2NarrativeArc() {
  const { 
    uploadedText, 
    phase1, 
    phase2, 
    setPhase2Options, 
    selectPhase2Option, 
    setPhase2Generating,
    settings 
  } = useWorkflowStore();
  
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number>(0);

  const generateOptions = async () => {
    if (!uploadedText || !phase1.selected) return;
    
    setPhase2Generating(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/generate/phase2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: uploadedText,
          context: { 
            phase1Selection: phase1.selected,
            optionsCount: 3 
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Phase 2 API response:', result);
      
      if (!result.data) {
        throw new Error('Invalid response: no data returned');
      }
      
      if (!Array.isArray(result.data)) {
        throw new Error('Invalid response: expected array of options');
      }
      
      setPhase2Options(result.data);
      setGenerationTime(Date.now() - startTime);
    } catch (error) {
      console.error('Phase 2 generation error:', error);
      alert(`Failed to generate story options: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase2Generating(false);
    }
  };

  const selectOption = (option: NarrativeArc) => {
    selectPhase2Option(option);
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'historical': return 'bg-purple-100 text-purple-800';
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'contemporary': return 'bg-green-100 text-green-800';
      case 'biblical': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 2: Narrative Arc</CardTitle>
          <CardDescription>
            Generate a &ldquo;Bookend Story&rdquo; that opens and closes the lecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!phase1.selected ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please complete Phase 1 first to select a Strategic Foundation</p>
            </div>
          ) : phase2.options.length === 0 ? (
            <div className="text-center py-8">
              <Button 
                onClick={generateOptions} 
                disabled={phase2.isGenerating}
                size="lg"
              >
                {phase2.isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Stories...</span>
                    <Timer isRunning={true} />
                  </div>
                ) : (
                  'Generate Bookend Story Options'
                )}
              </Button>
              {generationTime > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Generated in {Math.round(generationTime / 1000)}s</span>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Selected Aim:</p>
                <p className="italic">&quot;{phase1.selected.aim}&quot;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Story Options</h3>
                <Button variant="outline" onClick={generateOptions}>
                  Regenerate
                </Button>
              </div>
              
              {phase2.options.map((option, index) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    phase2.selected?.id === option.id 
                      ? 'ring-2 ring-blue-500' 
                      : 'hover:ring-1 hover:ring-gray-300'
                  }`}
                  onClick={() => selectOption(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Option {index + 1}</Badge>
                          <Badge className={getToneColor(option.tone || 'personal')}>
                            {(option.tone || 'personal').charAt(0).toUpperCase() + (option.tone || 'personal').slice(1)}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {option.resonanceScore || 0}% Resonance
                          </Badge>
                          {phase2.selected?.id === option.id && (
                            <Badge className="bg-blue-600">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium mb-2">{option.title}</h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-500">Opening</p>
                            <p className="line-clamp-2">{option.opening}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">Resolution</p>
                            <p className="line-clamp-2">{option.resolution}</p>
                          </div>
                        </div>
                        
                        {expandedStory === option.id && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm mb-2"><strong>Cliffhanger:</strong></p>
                            <p className="text-sm mb-3">{option.cliffhanger}</p>
                            <p className="text-sm mb-2"><strong>Characters:</strong></p>
                            <ul className="text-sm space-y-1">
                              {option.characters.map((char, i) => (
                                <li key={i}>
                                  {char.name} - {char.role}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedStory(expandedStory === option.id ? null : option.id);
                        }}
                      >
                        {expandedStory === option.id ? 'Show Less' : 'Show More'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {phase2.selected && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h4 className="font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Narrative Arc Selected
            </h4>
            <p className="text-sm mt-1">{phase2.selected.title}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
