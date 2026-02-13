'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Info, Clock, AlertCircle } from 'lucide-react';
import { StrategicFoundation } from '@/types/workflow';

function Timer({ isRunning, completedTime, onComplete }: { isRunning: boolean; completedTime?: number; onComplete?: () => void }) {
  const [seconds, setSeconds] = useState(completedTime ? Math.round(completedTime / 1000) : 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      setSeconds(0);
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onComplete]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${isRunning ? 'text-blue-600' : 'text-gray-600'}`}>
      <Clock className="h-4 w-4" />
      <span>{timeString}</span>
    </div>
  );
}

export function Phase1StrategicFoundation() {
  const { 
    uploadedText, 
    phase1, 
    setPhase1Options, 
    selectPhase1Option, 
    setPhase1Generating,
    settings 
  } = useWorkflowStore();
  
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number>(0);

  const generateOptions = async () => {
    if (!uploadedText) return;
    
    setPhase1Generating(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/generate/phase1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: uploadedText,
          context: { optionsCount: 3 }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Phase 1 API response:', result);
      
      if (!result.data) {
        throw new Error('Invalid response: no data returned');
      }
      
      if (!Array.isArray(result.data)) {
        throw new Error('Invalid response: expected array of options');
      }
      
      setPhase1Options(result.data);
      setGenerationTime(Date.now() - startTime);
    } catch (error) {
      console.error('Phase 1 generation error:', error);
      alert(`Failed to generate options: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase1Generating(false);
    }
  };

  const selectOption = (option: StrategicFoundation) => {
    selectPhase1Option(option);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 1: Strategic Foundation</CardTitle>
          <CardDescription>
            Analyze the biblical text and generate Aim & Divisional Principles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phase1.options.length === 0 ? (
            <div className="text-center py-8">
              <Button 
                onClick={generateOptions} 
                disabled={phase1.isGenerating}
                size="lg"
              >
                {phase1.isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Text...</span>
                    <Timer isRunning={true} />
                  </div>
                ) : (
                  'Generate Strategic Foundation Options'
                )}
              </Button>
              {generationTime > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Generated in {Math.round(generationTime / 1000)}s</span>
                </div>
              )}
              {!uploadedText && (
                <p className="text-sm text-gray-500 mt-2">
                  Please upload or enter lesson material first
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium">Generated Options</h3>
                  {!phase1.selected && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Select an option to continue
                    </Badge>
                  )}
                </div>
                <Button variant="outline" onClick={generateOptions}>
                  Regenerate
                </Button>
              </div>
              
              {phase1.options.map((option, index) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    phase1.selected?.id === option.id 
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
                          <Badge className={getConfidenceColor(option.confidenceScore)}>
                            {option.confidenceScore}% Confidence
                          </Badge>
                          {phase1.selected?.id === option.id && (
                            <Badge className="bg-blue-600">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium mb-2">{option.aim}</h4>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <strong>Divisions:</strong> {option.divisions.length} sections
                          </p>
                          
                          {showDetails === option.id && (
                            <div className="mt-4 pl-4 border-l-2 space-y-3">
                              {option.divisions.map((division, divIndex) => (
                                <div key={division.id}>
                                  <p className="font-medium text-sm">
                                    {divIndex + 1}. {division.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {division.scriptureRange}
                                  </p>
                                  <p className="text-sm italic text-gray-600">
                                    &ldquo;{division.principle}&rdquo;
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(showDetails === option.id ? null : option.id);
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {phase1.selected && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              Strategic Foundation Selected
            </h4>
            <p className="text-sm mt-1">{phase1.selected.aim}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
