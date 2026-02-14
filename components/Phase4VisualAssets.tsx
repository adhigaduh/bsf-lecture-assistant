'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image as ImageIcon, Copy, Check, Download, Clock, XCircle } from 'lucide-react';
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
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateImage = async (asset: VisualAsset) => {
    setGeneratingImage(asset.id);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: asset.visualPrompt,
          textOnSlide: asset.textOnSlide,
          slideType: asset.slideSection
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const result = await response.json();

      if (result.imageData) {
        setGeneratedImages(prev => ({
          ...prev,
          [asset.id]: result.imageData
        }));
      } else {
        alert('Image generation may not be available. Check API key.');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert('Failed to generate image');
    } finally {
      setGeneratingImage(null);
    }
  };

  const toggleSelectAsset = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const generateSelectedImages = async () => {
    const selectedList = phase4.visualAssets.filter(a => selectedAssets.has(a.id));
    for (const asset of selectedList) {
      await generateImage(asset);
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhase4Generating(false);
  };

  const generateVisualAssets = async () => {
    if (!phase1.selected || !phase3.lecture) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setPhase4Generating(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate/phase4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            phase1Selection: phase1.selected,
            phase3Lecture: phase3.lecture
          }
        }),
        signal: abortControllerRef.current.signal,
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
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation cancelled by user');
        return;
      }
      console.error('Phase 4 generation error:', error);
      alert(`Failed to generate visual assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPhase4Generating(false);
      abortControllerRef.current = null;
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
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please complete Phase 3 first</p>
            </div>
          ) : phase4.visualAssets.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3">
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
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Generate Visual Assets
                    </>
                  )}
                </Button>
                {phase4.isGenerating && (
                  <Button 
                    variant="destructive" 
                    size="lg"
                    onClick={cancelGeneration}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
              {generationTime > 0 && !phase4.isGenerating && (
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
                  <Button 
                    variant="outline" 
                    onClick={generateVisualAssets}
                    disabled={phase4.isGenerating}
                  >
                    {phase4.isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Regenerate Prompts
                      </>
                    )}
                  </Button>
                  {phase4.isGenerating && (
                    <Button 
                      variant="destructive"
                      onClick={cancelGeneration}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
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
                {/* Selection controls */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedAssets.size === phase4.visualAssets.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssets(new Set(phase4.visualAssets.map(a => a.id)));
                          } else {
                            setSelectedAssets(new Set());
                          }
                        }}
                        className="rounded"
                      />
                      Select All ({selectedAssets.size} selected)
                    </label>
                  </div>
                  <Button 
                    onClick={generateSelectedImages}
                    disabled={selectedAssets.size === 0 || generatingImage !== null}
                    size="sm"
                  >
                    {generatingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate Selected Images
                      </>
                    )}
                  </Button>
                </div>

                {phase4.visualAssets.map((asset, index) => (
                  <Card key={asset.id} className={selectedAssets.has(asset.id) ? 'ring-2 ring-blue-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedAssets.has(asset.id)}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="mt-2 rounded"
                        />
                        
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
                          
                          {/* Generate Image Button */}
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateImage(asset)}
                              disabled={generatingImage === asset.id}
                            >
                              {generatingImage === asset.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : generatedImages[asset.id] ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-green-600" />
                                  Regenerate
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Generate Image
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Generated Image Display */}
                          {generatedImages[asset.id] && (
                            <div className="mt-4 border-t pt-4">
                              <p className="text-sm font-medium text-gray-800 mb-2">Generated Image:</p>
                              <div className="relative">
                                <img
                                  src={generatedImages[asset.id]}
                                  alt={`Generated for ${asset.slideSection}`}
                                  className="w-full rounded-lg border"
                                />
                              </div>
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
