'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, Copy, Check, Download, Clock } from 'lucide-react';
import { VisualAsset } from '@/types/workflow';

function Timer({ isRunning, completedTime, onComplete }: { isRunning: boolean; completedTime?: number; onComplete?: () => void }) {
  const [seconds, setSeconds] = useState(completedTime ? Math.round(completedTime / 1000) : 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          const newSeconds = s + 1;
          if (onComplete && newSeconds > 180) {
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

export function Phase4VisualAssets() {
  const { 
    phase1,
    phase3,
    phase4, 
    setVisualAssets, 
    setPhase4Generating
  } = useWorkflowStore();
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyAll, setCopyAll] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);

  const generateVisualAssets = async () => {
    if (!phase1.selected) return;
    
    setPhase4Generating(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/generate/phase4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: { 
            phase1Selection: phase1.selected
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Phase 4 API response:', result);
      
      if (!result.data) {
        throw new Error('Invalid response: no data returned');
      }
      
      if (!Array.isArray(result.data)) {
        throw new Error('Invalid response: expected array of visual assets');
      }
      
      setVisualAssets(result.data);
      setGenerationTime(Date.now() - startTime);
    } catch (error) {
      console.error('Phase 4 generation error:', error);
      alert(`Failed to generate visual assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase4Generating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllPrompts = () => {
    const allPrompts = phase4.visualAssets
      .map(asset => `## ${asset.slideSection}\n${asset.textOnSlide}\n\nPrompt: ${asset.visualPrompt}`)
      .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(allPrompts);
    setCopyAll(true);
    setTimeout(() => setCopyAll(false), 2000);
  };

  const downloadCSV = () => {
    const headers = ['Slide Section', 'Text on Slide', 'Visual Prompt'];
    const rows = phase4.visualAssets.map(asset => [
      asset.slideSection,
      `"${asset.textOnSlide.replace(/"/g, '""')}"`,
      `"${asset.visualPrompt.replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-assets.csv';
    a.click();
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'dramatic': return 'bg-red-100 text-red-800';
      case 'peaceful': return 'bg-blue-100 text-blue-800';
      case 'triumphant': return 'bg-amber-100 text-amber-800';
      case 'reflective': return 'bg-purple-100 text-purple-800';
      case 'hopeful': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 4: Visual Assets</CardTitle>
          <CardDescription>
            Generate AI image prompts for slides based on the lecture content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!phase3.lecture ? (
            <div className="text-center py-8 text-gray-500">
              <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please complete Phase 3 first</p>
            </div>
          ) : phase4.visualAssets.length === 0 ? (
            <div className="text-center py-8">
              <Button 
                onClick={generateVisualAssets} 
                disabled={phase4.isGenerating}
                size="lg"
              >
                {phase4.isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Visual Assets...</span>
                    <Timer isRunning={true} />
                  </div>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Generate Visual Assets
                  </>
                )}
              </Button>
              {generationTime > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Generated in {Math.round(generationTime / 1000)}s</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {phase4.visualAssets.length} Visual Assets Generated
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyAllPrompts}>
                    {copyAll ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={downloadCSV}>
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {phase4.visualAssets.map((asset, index) => (
                  <Card key={asset.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{asset.slideSection}</h4>
                            <Badge className={getMoodColor(asset.style?.mood || 'neutral')}>
                              {asset.style?.mood || 'neutral'}
                            </Badge>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">Text on Slide:</p>
                            <p className="text-sm">{asset.textOnSlide}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-800">Visual Prompt:</p>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(asset.visualPrompt, asset.id)}
                              >
                                {copiedId === asset.id ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600">{asset.visualPrompt}</p>
                          </div>
                          
                          {asset.style && (
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span>Colors: {asset.style.colors?.join(', ')}</span>
                              <span>•</span>
                              <span>{asset.style.composition}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
