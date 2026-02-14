'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image as ImageIcon, Copy, Check, Download, Clock, XCircle, Palette, Eye, Sparkles, ChevronRight } from 'lucide-react';
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

  // Design themes state
  const [designThemes, setDesignThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showThemeSelection, setShowThemeSelection] = useState(true);

  // Per-slide generation options
  const [generateWithoutText, setGenerateWithoutText] = useState(false);

  // Design preferences for theme generation
  const [visualStylePref, setVisualStylePref] = useState<string>('');
  const [colorPalettePref, setColorPalettePref] = useState<string>('');
  const [moodPref, setMoodPref] = useState<string>('');

  const visualStyleOptions = [
    { value: '', label: 'Auto (AI decides)' },
    { value: 'photographic', label: 'Photographic (realistic photos)' },
    { value: 'illustrated', label: 'Illustrated (drawings/illustrations)' },
    { value: 'minimalist', label: 'Minimalist (simple, clean)' },
    { value: 'textured', label: 'Textured (paper, fabric, stone textures)' },
    { value: 'geometric', label: 'Geometric (shapes, patterns)' },
    { value: 'watercolor', label: 'Watercolor (painted effects)' },
    { value: 'cinematic', label: 'Cinematic (movie-like scenes)' },
  ];

  const colorPaletteOptions = [
    { value: '', label: 'Auto (AI decides)' },
    { value: 'warm', label: 'Warm Tones (oranges, reds, golds)' },
    { value: 'cool', label: 'Cool Tones (blues, greens, purples)' },
    { value: 'neutral', label: 'Neutral (beige, gray, white, brown)' },
    { value: 'vibrant', label: 'Vibrant (bright, saturated colors)' },
    { value: 'muted', label: 'Muted (soft, desaturated colors)' },
    { value: 'monochrome', label: 'Monochrome (variations of one color)' },
    { value: 'earth', label: 'Earth Tones (natural browns, greens, tans)' },
    { value: 'pastel', label: 'Pastel (soft pinks, blues, yellows)' },
  ];

  const moodOptions = [
    { value: '', label: 'Auto (AI decides)' },
    { value: 'dramatic', label: 'Dramatic (intense, powerful)' },
    { value: 'peaceful', label: 'Peaceful (calm, serene)' },
    { value: 'hopeful', label: 'Hopeful (uplifting, optimistic)' },
    { value: 'reflective', label: 'Reflective (contemplative, thoughtful)' },
    { value: 'triumphant', label: 'Triumphant (victorious, celebratory)' },
    { value: 'intimate', label: 'Intimate (warm, personal)' },
    { value: 'majestic', label: 'Majestic (grand, awe-inspiring)' },
    { value: 'somber', label: 'Somber (serious, solemn)' },
  ];

  const generateImage = async (asset: VisualAsset) => {
    setGeneratingImage(asset.id);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: asset.visualPrompt,
          textOnSlide: generateWithoutText ? null : asset.textOnSlide,
          slideType: asset.slideSection,
          generateWithoutText: generateWithoutText
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
    setIsGeneratingThemes(false);
    setIsGeneratingPreview(false);
  };

  const generateDesignThemes = async () => {
    if (!phase1.selected || !phase3.lecture) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsGeneratingThemes(true);

    try {
      const response = await fetch('/api/generate/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            phase1Selection: phase1.selected,
            phase3Lecture: phase3.lecture,
            preferences: {
              visualStyle: visualStylePref,
              colorPalette: colorPalettePref,
              mood: moodPref
            }
          }
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Design themes response:', result);

      if (!result.data) {
        throw new Error('Invalid response: no data returned');
      }

      if (!Array.isArray(result.data)) {
        throw new Error('Invalid response: expected array of themes');
      }

      setDesignThemes(result.data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation cancelled by user');
        return;
      }
      console.error('Design themes generation error:', error);
      alert(`Failed to generate design themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingThemes(false);
      abortControllerRef.current = null;
    }
  };

  const generatePreviewImage = async () => {
    if (!selectedTheme || !phase3.lecture) return;

    setIsGeneratingPreview(true);

    try {
      // Generate just the title slide preview
      const titlePrompt = `Create a presentation title slide with this design theme:
Theme: ${selectedTheme.name}
Description: ${selectedTheme.description}
Color Palette: ${selectedTheme.colorPalette?.map((c: any) => c.hex).join(', ')}
Mood: ${selectedTheme.mood}
Visual Style: ${selectedTheme.visualStyle}
Lighting: ${selectedTheme.lighting}
Typography: ${selectedTheme.typography}

Title: ${phase3.lecture.title}
Scripture: ${phase3.lecture.scriptureReference}
Label: "BSF Lecture"

Create a beautiful 16:9 title slide background. Leave space for text overlay.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: titlePrompt,
          textOnSlide: `${phase3.lecture.title}\n${phase3.lecture.scriptureReference}\nBSF Lecture`,
          slideType: 'Title'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const result = await response.json();

      if (result.imageData) {
        setPreviewImage(result.imageData);
      } else {
        alert('Preview generation not available');
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      alert('Failed to generate preview image');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const selectTheme = (theme: any) => {
    setSelectedTheme(theme);
    setPreviewImage(null); // Clear previous preview
  };

  const proceedWithTheme = () => {
    if (!selectedTheme) return;
    setShowThemeSelection(false);
    generateVisualAssetsWithTheme();
  };

  const generateVisualAssetsWithTheme = async () => {
    if (!phase1.selected || !phase3.lecture || !selectedTheme) return;

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
            phase3Lecture: phase3.lecture,
            selectedTheme: selectedTheme
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

  const regenerateThemes = () => {
    setDesignThemes([]);
    setSelectedTheme(null);
    setPreviewImage(null);
    generateDesignThemes();
  };

  // Legacy function for regenerating without theme selection
  const generateVisualAssets = async () => {
    if (selectedTheme) {
      await generateVisualAssetsWithTheme();
    } else {
      // Fallback to default generation
      await generateVisualAssetsWithTheme();
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
          ) : showThemeSelection && designThemes.length === 0 ? (
            // Step 1: Design Preferences & Generate Themes
            <div className="text-center py-8">
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <Palette className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-medium mb-2">Choose Your Visual Design Preferences</h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Customize the design direction or leave as "Auto" for AI to decide. 
                    We'll generate 3 distinct themes based on your preferences.
                  </p>
                  
                  {/* Design Preference Dropdowns */}
                  <div className="max-w-2xl mx-auto mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Visual Style */}
                      <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Visual Style
                        </label>
                        <select
                          value={visualStylePref}
                          onChange={(e) => setVisualStylePref(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {visualStyleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Color Palette */}
                      <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color Palette
                        </label>
                        <select
                          value={colorPalettePref}
                          onChange={(e) => setColorPalettePref(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {colorPaletteOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Mood */}
                      <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mood
                        </label>
                        <select
                          value={moodPref}
                          onChange={(e) => setMoodPref(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {moodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Selected Preferences Summary */}
                    {(visualStylePref || colorPalettePref || moodPref) && (
                      <div className="text-left p-3 bg-white/50 rounded-lg text-sm">
                        <span className="font-medium text-purple-700">Your preferences:</span>
                        <span className="text-gray-600 ml-2">
                          {[
                            visualStylePref && visualStyleOptions.find(o => o.value === visualStylePref)?.label.split(' (')[0],
                            colorPalettePref && colorPaletteOptions.find(o => o.value === colorPalettePref)?.label.split(' (')[0],
                            moodPref && moodOptions.find(o => o.value === moodPref)?.label.split(' (')[0]
                          ].filter(Boolean).join(' • ') || 'None selected'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Button 
                      onClick={generateDesignThemes} 
                      disabled={isGeneratingThemes}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isGeneratingThemes ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating Themes...</span>
                          <Timer isRunning={true} />
                        </div>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Design Themes
                        </>
                      )}
                    </Button>
                    {isGeneratingThemes && (
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
                </div>
              </div>
            </div>
          ) : showThemeSelection && designThemes.length > 0 ? (
            // Step 2: Select Theme and Preview
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Select a Design Theme</h3>
                  <p className="text-sm text-gray-600">Choose the visual style that best fits your lecture</p>
                </div>
                <Button variant="outline" onClick={regenerateThemes} disabled={isGeneratingThemes}>
                  {isGeneratingThemes ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate New Themes
                </Button>
              </div>

              {/* Theme Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {designThemes.map((theme, index) => (
                  <Card 
                    key={theme.id || index}
                    className={`cursor-pointer transition-all ${
                      selectedTheme?.id === theme.id 
                        ? 'ring-2 ring-purple-500 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => selectTheme(theme)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">Theme {index + 1}</Badge>
                        {selectedTheme?.id === theme.id && (
                          <Badge className="bg-purple-600">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-lg mb-2">{theme.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                      
                      {/* Color Palette */}
                      <div className="flex gap-2 mb-3">
                        {theme.colorPalette?.map((color: any, i: number) => (
                          <div key={i} className="flex items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-500">
                        <p><span className="font-medium">Mood:</span> {theme.mood}</p>
                        <p><span className="font-medium">Style:</span> {theme.visualStyle}</p>
                        <p><span className="font-medium">Lighting:</span> {theme.lighting}</p>
                      </div>
                      
                      {theme.rationale && (
                        <p className="text-xs text-purple-600 mt-2 italic">{theme.rationale}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Preview Section */}
              {selectedTheme && (
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      Preview: Title Slide
                    </CardTitle>
                    <CardDescription>
                      See how the "{selectedTheme.name}" theme looks with your lecture title
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {previewImage ? (
                        <div className="relative">
                          <img 
                            src={previewImage} 
                            alt="Title slide preview" 
                            className="w-full rounded-lg shadow-lg"
                            style={{ aspectRatio: '16/9' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center p-8">
                              <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                                {phase3.lecture?.title}
                              </h2>
                              <p className="text-xl text-white drop-shadow-md">
                                {phase3.lecture?.scriptureReference}
                              </p>
                              <Badge className="mt-4 bg-white/20 text-white">BSF Lecture</Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                          <div className="text-center p-8">
                            <p className="text-gray-500 mb-4">No preview generated yet</p>
                            <Button 
                              onClick={generatePreviewImage}
                              disabled={isGeneratingPreview}
                            >
                              {isGeneratingPreview ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating Preview...
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Generate Preview
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => setSelectedTheme(null)}
                        >
                          Change Theme
                        </Button>
                        <Button 
                          onClick={proceedWithTheme}
                          disabled={phase4.isGenerating}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {phase4.isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Slides...
                            </>
                          ) : (
                            <>
                              Proceed with This Theme
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {phase4.visualAssets.length} Visual Assets Generated
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-gray-600 mt-1 cursor-pointer hover:text-gray-800">
                    <input
                      type="checkbox"
                      checked={generateWithoutText}
                      onChange={(e) => setGenerateWithoutText(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Generate images without text (for manual text overlay)
                  </label>
                </div>
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
