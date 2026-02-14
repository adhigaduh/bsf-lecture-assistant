'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Check, BookOpen, Clock, Edit3, X, Save, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
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

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedOption, setEditedOption] = useState<NarrativeArc | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateOptions = async () => {
    if (!uploadedText || !phase1.selected) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
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
        signal: abortControllerRef.current.signal,
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
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation cancelled by user');
        return;
      }
      console.error('Phase 2 generation error:', error);
      alert(`Failed to generate story options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPhase2Generating(false);
      abortControllerRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhase2Generating(false);
  };

  const selectOption = (option: NarrativeArc) => {
    // Enter edit mode with the selected option
    setEditedOption(JSON.parse(JSON.stringify(option))); // Deep copy
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedOption(null);
  };

  const acceptEdit = () => {
    if (editedOption) {
      selectPhase2Option(editedOption);
      setIsEditing(false);
      setEditedOption(null);
    }
  };

  const updateField = (field: keyof NarrativeArc, value: any) => {
    if (editedOption) {
      setEditedOption({ ...editedOption, [field]: value });
    }
  };

  const updateCharacter = (index: number, field: string, value: string) => {
    if (editedOption && editedOption.characters) {
      const newCharacters = [...editedOption.characters];
      newCharacters[index] = { ...newCharacters[index], [field]: value };
      setEditedOption({ ...editedOption, characters: newCharacters });
    }
  };

  const updateSetting = (field: string, value: string) => {
    if (editedOption && editedOption.setting) {
      setEditedOption({
        ...editedOption,
        setting: { ...editedOption.setting, [field]: value }
      });
    }
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
              <div className="flex items-center justify-center gap-3">
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
                {phase2.isGenerating && (
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
                <Button variant="outline" onClick={generateOptions} disabled={phase2.isGenerating}>
                  {phase2.isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Regenerate'
                  )}
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
                           <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                             <div>
                               <p className="text-sm font-medium text-gray-700 mb-1">Opening Story</p>
                               <p className="text-sm text-gray-600 whitespace-pre-wrap">{option.opening}</p>
                             </div>
                             <div>
                               <p className="text-sm font-medium text-gray-700 mb-1">Cliffhanger</p>
                               <p className="text-sm text-gray-600 whitespace-pre-wrap">{option.cliffhanger}</p>
                             </div>
                             <div>
                               <p className="text-sm font-medium text-gray-700 mb-1">Resolution</p>
                               <p className="text-sm text-gray-600 whitespace-pre-wrap">{option.resolution}</p>
                             </div>
                             <div>
                               <p className="text-sm font-medium text-gray-700 mb-1">Characters</p>
                               <ul className="text-sm space-y-1">
                                 {option.characters?.map((char, i) => (
                                   <li key={i} className="text-gray-600">
                                     <span className="font-medium">{char.name}</span> - {char.role}
                                     {char.description && <span className="text-gray-400"> ({char.description})</span>}
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             {option.setting && (
                               <div>
                                 <p className="text-sm font-medium text-gray-700 mb-1">Setting</p>
                                 <p className="text-sm text-gray-600">
                                   {option.setting.time && <span>{option.setting.time}</span>}
                                   {option.setting.place && <span> • {option.setting.place}</span>}
                                   {option.setting.context && <span> • {option.setting.context}</span>}
                                 </p>
                               </div>
                             )}
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

      {/* Edit Mode - Show after selecting an option */}
      {isEditing && editedOption && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit3 className="h-5 w-5 text-green-600" />
                Edit Narrative Arc
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={acceptEdit} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-1" />
                  Accept & Continue
                </Button>
              </div>
            </div>
            <CardDescription>
              Review and edit the story elements before proceeding to Phase 3
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Story Title</label>
              <Input
                value={editedOption.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Story title..."
              />
            </div>

            {/* Opening */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opening Story</label>
              <Textarea
                value={editedOption.opening}
                onChange={(e) => updateField('opening', e.target.value)}
                rows={4}
                placeholder="The opening story that introduces the theme..."
              />
            </div>

            {/* Cliffhanger */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliffhanger</label>
              <Textarea
                value={editedOption.cliffhanger}
                onChange={(e) => updateField('cliffhanger', e.target.value)}
                rows={3}
                placeholder="The tension point that creates suspense..."
              />
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
              <Textarea
                value={editedOption.resolution}
                onChange={(e) => updateField('resolution', e.target.value)}
                rows={4}
                placeholder="How the story resolves and connects to the lecture..."
              />
            </div>

            {/* Characters */}
            {editedOption.characters && editedOption.characters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Characters</h4>
                <div className="space-y-3">
                  {editedOption.characters.map((char, index) => (
                    <Card key={index} className="bg-gray-50">
                      <CardContent className="p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Name</label>
                            <Input
                              value={char.name}
                              onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                              placeholder="Character name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Role</label>
                            <Input
                              value={char.role}
                              onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                              placeholder="Protagonist, Confidant, etc."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <Input
                            value={char.description || ''}
                            onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                            placeholder="Brief character description"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Setting */}
            {editedOption.setting && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Setting</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <Input
                      value={editedOption.setting.time || ''}
                      onChange={(e) => updateSetting('time', e.target.value)}
                      placeholder="e.g., Present day"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Place</label>
                    <Input
                      value={editedOption.setting.place || ''}
                      onChange={(e) => updateSetting('place', e.target.value)}
                      placeholder="e.g., Jakarta, Indonesia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Context</label>
                    <Input
                      value={editedOption.setting.context || ''}
                      onChange={(e) => updateSetting('context', e.target.value)}
                      placeholder="e.g., Career decision"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phase2.selected && !isEditing && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Narrative Arc Selected
                </h4>
                <p className="text-sm mt-1">{phase2.selected.title}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setEditedOption(JSON.parse(JSON.stringify(phase2.selected)));
                setIsEditing(true);
              }}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
