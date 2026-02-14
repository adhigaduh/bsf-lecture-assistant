'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Music, Clock, ChevronDown, ChevronUp, Save, Check, BookOpen, Upload, FileText } from 'lucide-react';
import { Lecture, WorshipSong } from '@/types/workflow';
import { exportToMarkdown } from '@/lib/export/markdown';

function Timer({ isRunning, completedTime, onComplete }: { isRunning: boolean; completedTime?: number; onComplete?: () => void }) {
  const [seconds, setSeconds] = useState(completedTime ? Math.round(completedTime / 1000) : 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          const newSeconds = s + 1;
          if (onComplete && newSeconds > 600) {
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

export function Phase3LectureGeneration() {
  const { 
    uploadedText, 
    phase1, 
    phase2, 
    phase3, 
    phase4,
    setLecture, 
    setWorshipSongs,
    setPhase3Generating,
    nextPhase
  } = useWorkflowStore();
  
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('lecture');
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  
  // Markdown style upload state
  const [styleMarkdown, setStyleMarkdown] = useState('');
  const [styleFileName, setStyleFileName] = useState('');
  const [styleFileSize, setStyleFileSize] = useState('');
  const [isConfirmingStyle, setIsConfirmingStyle] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<any>(null);
  const [styleConfirmed, setStyleConfirmed] = useState(false);

  const acceptAndSaveLecture = async () => {
    if (!phase3.lecture) {
      alert('No lecture to save');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('Saving lecture:', phase3.lecture.title);
      console.log('Visual assets:', phase4.visualAssets);
      console.log('Worship songs:', phase3.worshipSongs);
      
      const markdown = exportToMarkdown(
        phase3.lecture,
        phase4?.visualAssets || [],
        phase3.worshipSongs || []
      );
      
      console.log('Markdown length:', markdown.length);
      
      const response = await fetch('/api/save-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          fileName: phase3.lecture.title
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      setSavedMessage(`Saved to: ${result.fileName}`);
      setTimeout(() => setSavedMessage(''), 5000);
    } catch (error) {
      console.error('Error saving lecture:', error);
      alert(`Failed to save lecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateLecture = async () => {
    if (!phase1.selected || !phase2.selected) return;
    
    setPhase3Generating(true, 0);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadedText,
          context: {
            phase1Selection: phase1.selected,
            phase2Selection: phase2.selected
          },
          styleMarkdown: styleMarkdown || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      setPhase3Generating(true, 50);
      
      const result = await response.json();
      console.log('Phase 3 API response:', JSON.stringify(result).substring(0, 500));
      
      if (!result.data?.lecture) {
        console.error('No lecture in response:', result);
        throw new Error('Invalid response: lecture data missing');
      }
      
      // Normalize lecture data to match expected format
      const lecture = result.data.lecture;
      
      // Handle body divisions - API returns body.divisions or body as array
      let bodyArray = [];
      if (Array.isArray(lecture.body)) {
        bodyArray = lecture.body;
      } else if (lecture.body?.divisions && Array.isArray(lecture.body.divisions)) {
        bodyArray = lecture.body.divisions;
      } else if (lecture.body && typeof lecture.body === 'object') {
        bodyArray = Object.values(lecture.body).filter((d: any) => d && (d.division_number || d.title || d.id));
      }
      
      // Normalize each division to have the expected structure
      const normalizedBody = bodyArray.map((div: any, idx: number) => {
        // Handle different API response structures
        // Applications might be in various locations:
        // 1. div.application or div.applications
        // 2. div.application_questions
        // 3. div.applications_young_professionals, div.applications_fathers_mid_life, div.applications_elders
        const apps = div.application || div.applications || {};
        
        // Find the right keys for each age group (API uses inconsistent naming)
        let youngKey = Object.keys(apps).find(k => 
          k.toLowerCase().includes('young') || 
          k.toLowerCase().includes('20') ||
          k.toLowerCase().includes('professional')
        );
        let middleKey = Object.keys(apps).find(k => 
          k.toLowerCase().includes('middle') || 
          k.toLowerCase().includes('40') ||
          k.toLowerCase().includes('fath')
        );
        let olderKey = Object.keys(apps).find(k => 
          k.toLowerCase().includes('older') || 
          k.toLowerCase().includes('60') ||
          k.toLowerCase().includes('elder')
        );
        
        // Also check for direct properties on division
        const divApps = div.applications || div.application_questions || {};
        const directYoungKey = Object.keys(divApps).find(k => 
          k.toLowerCase().includes('young') || 
          k.toLowerCase().includes('20') ||
          k.toLowerCase().includes('professional')
        );
        const directMiddleKey = Object.keys(divApps).find(k => 
          k.toLowerCase().includes('middle') || 
          k.toLowerCase().includes('40') ||
          k.toLowerCase().includes('fath')
        );
        const directOlderKey = Object.keys(divApps).find(k => 
          k.toLowerCase().includes('older') || 
          k.toLowerCase().includes('60') ||
          k.toLowerCase().includes('elder')
        );
        
        // Use direct properties if nested apps doesn't have the key
        if (!youngKey && directYoungKey) youngKey = directYoungKey;
        if (!middleKey && directMiddleKey) middleKey = directMiddleKey;
        if (!olderKey && directOlderKey) olderKey = directOlderKey;

        // Also check for application fields directly on the division
        const getDirectAppQuestion = (field: string): string => {
          if (div[field]) {
            const val = div[field];
            if (Array.isArray(val)) return val[0] || '';
            if (typeof val === 'string') return val;
            if (val && val.question) return val.question;
          }
          return '';
        };

        const directYoungQuestion = getDirectAppQuestion('application_young_professionals');
        const directMiddleQuestion = getDirectAppQuestion('application_fathers_mid_life');
        const directOlderQuestion = getDirectAppQuestion('application_elders');

        // Fallback to check all division properties for application questions
        const getAllDivisionApps = (): Record<string, string> => {
          const result: Record<string, string> = {};
          if (!div || typeof div !== 'object') return result;
          
          for (const [key, val] of Object.entries(div)) {
            if (key.includes('application') || key.includes('question')) {
              if (key.includes('young') || key.includes('20')) {
                result.youngProfessionals = result.youngProfessionals || (Array.isArray(val) ? val[0] : typeof val === 'string' ? val : '');
              } else if (key.includes('middle') || key.includes('40') || key.includes('fath')) {
                result.fathersMidLife = result.fathersMidLife || (Array.isArray(val) ? val[0] : typeof val === 'string' ? val : '');
              } else if (key.includes('older') || key.includes('60') || key.includes('elder')) {
                result.elders = result.elders || (Array.isArray(val) ? val[0] : typeof val === 'string' ? val : '');
              }
            }
          }
          return result;
        };

        const fallbackApps = getAllDivisionApps();

        const getQuestion = (key: string | undefined): string => {
          if (!key) return '';

          // Try nested apps first
          if (apps[key]) {
            const val = apps[key];
            if (Array.isArray(val)) return val[0] || '';
            if (typeof val === 'string') return val;
            if (val.question) return val.question;
            if (val.questions && Array.isArray(val.questions)) return val.questions[0];
            if (val.questions && typeof val.questions === 'string') return val.questions;
          }

          // Try direct division properties
          if (divApps[key]) {
            const val = divApps[key];
            if (Array.isArray(val)) return val[0] || '';
            if (typeof val === 'string') return val;
            if (val.question) return val.question;
            if (val.questions && Array.isArray(val.questions)) return val.questions[0];
          }

          return '';
        };
        
        return {
          id: div.id || `div-${idx + 1}`,
          title: div.title || div.division_title || '',
          scriptureRange: div.scriptureRange || div.scripture_reference || div.scripture || '',
          exposition: div.exposition?.content || div.exposition?.text || div.exposition || '',
          principle: div.principle_statement?.content || div.principle_statement?.text || div.principle || div.principle_statement || '',
          applications: {
            youngProfessionals: {
              question: directYoungQuestion || getQuestion(youngKey),
              discussionPoints: [],
              reflectionTime: 5,
            },
            fathersMidLife: {
              question: directMiddleQuestion || getQuestion(middleKey),
              discussionPoints: [],
              reflectionTime: 5,
            },
            elders: {
              question: directOlderQuestion || getQuestion(olderKey),
              discussionPoints: [],
              reflectionTime: 5,
            },
          },
          transitions: div.transitions || '',
        };
      });
      
      // Extract conclusion parts from content
      const conclusionContent = lecture.conclusion?.content || '';
      let storyResolution = conclusionContent;
      let closingPrayer = '';
      
      // Try to find prayer section at the end by looking for common patterns
      const prayerKeywords = ['Let us pray:', 'Prayer:', 'Amen.'];
      for (const keyword of prayerKeywords) {
        const idx = conclusionContent.lastIndexOf(keyword);
        if (idx > conclusionContent.length - 500 && idx > 100) {
          storyResolution = conclusionContent.substring(0, idx + keyword.length).trim();
          closingPrayer = conclusionContent.substring(idx).trim();
          break;
        }
      }
      
      // If no prayer found, split roughly at 70% mark
      if (!closingPrayer && conclusionContent.length > 500) {
        const splitPoint = Math.floor(conclusionContent.length * 0.7);
        const splitIdx = conclusionContent.indexOf('. ', splitPoint);
        if (splitIdx > splitPoint - 200) {
          storyResolution = conclusionContent.substring(0, splitIdx + 1);
          closingPrayer = conclusionContent.substring(splitIdx + 1).trim();
        }
      }
      
      const normalizedLecture = {
        id: lecture.id || lecture.metadata?.id || 'lecture-' + Date.now(),
        title: lecture.title || lecture.metadata?.title || lecture.metadata?.aim || lecture.metadata?.lecture_aim || 'Untitled Lecture',
        scriptureReference: lecture.scriptureReference || lecture.metadata?.scripture_references || lecture.metadata?.scripture_passage || '',
        introduction: {
          storyOpening: lecture.introduction?.storyOpening || lecture.introduction?.content || '',
          cliffhanger: lecture.introduction?.cliffhanger || '',
          transitionToText: lecture.introduction?.transitionToText || '',
        },
        body: normalizedBody,
        conclusion: {
          storyResolution: storyResolution,
          callToAction: lecture.conclusion?.callToAction || storyResolution,
          closingPrayer: closingPrayer || lecture.conclusion?.closingPrayer || '',
          finalThought: '',
        },
        metadata: lecture.metadata || {},
      };
      
      console.log('Normalized conclusion:', { 
        storyResolution: storyResolution.substring(0, 50), 
        callToAction: '...', 
        closingPrayer: closingPrayer.substring(0, 50) 
      });
      
      console.log('Normalized lecture:', JSON.stringify(normalizedLecture).substring(0, 500));
      
      setLecture(normalizedLecture);
      setWorshipSongs(result.data.worshipSongs || []);
      setPhase3Generating(false, 100);
      setGenerationTime(Date.now() - startTime);
      
      // Wait for state to settle and persist
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Phase 3 generation error:', error);
      alert(`Failed to generate lecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase3Generating(false, 0);
    }
  };

  // Markdown style upload handlers

  // Markdown style upload handlers
  const handleStyleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStyleFileName(file.name);
    setStyleFileSize(formatFileSize(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setStyleMarkdown(content);
      analyzeStyle(content);
    };
    reader.readAsText(file);
  };

  const handleStyleFileDrop = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500');
    
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith('.md')) {
      alert('Please upload a markdown (.md) file');
      return;
    }

    setStyleFileName(file.name);
    setStyleFileSize(formatFileSize(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setStyleMarkdown(content);
      analyzeStyle(content);
    };
    reader.readAsText(file);
  };

  const resetStyleMarkdown = () => {
    setStyleMarkdown('');
    setStyleFileName('');
    setStyleFileSize('');
    setStyleAnalysis(null);
  };

  const analyzeStyle = (content: string) => {
    // Extract style elements from markdown
    const analysis = {
      tone: '',
      style: '',
      structure: '',
      audience: '',
      length: content.split(/\s+/).length,
    };

    // Detect tone indicators
    const toneKeywords = {
      conversational: ['conversational', 'story', 'storytelling', 'personal', 'intimate'],
      formal: ['formal', 'academic', 'scholarly', 'professional', 'academic'],
      creative: ['creative', 'metaphor', 'poetic', 'literary', 'imaginative'],
      practical: ['practical', 'application', 'action-oriented', 'instructional'],
      inspirational: ['inspirational', 'uplifting', 'encouraging', 'motivational', 'encourage'],
    };

    for (const [tone, keywords] of Object.entries(toneKeywords)) {
      if (keywords.some(k => content.toLowerCase().includes(k))) {
        analysis.tone = tone;
        break;
      }
    }

    // Detect style indicators
    if (content.length > 5000) {
      analysis.style = 'expositional';
    } else if (content.includes('##') || content.includes('###')) {
      analysis.style = 'structured';
    } else {
      analysis.style = 'simple';
    }

    // Detect structure
    const headingCount = (content.match(/^#+\s/mg) || []).length;
    if (headingCount > 10) {
      analysis.structure = 'detailed';
    } else if (headingCount >= 5) {
      analysis.structure = 'standard';
    } else {
      analysis.structure = 'simple-minimal';
    }

    // Detect audience
    if (content.toLowerCase().includes('brother') || content.toLowerCase().includes('men')) {
      analysis.audience = 'Men';
    } else if (content.toLowerCase().includes('you') || content.toLowerCase().includes('student')) {
      analysis.audience = 'General';
    }

    setStyleAnalysis(analysis);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const confirmStyleMarkdown = () => {
    setIsConfirmingStyle(true);
    
    setTimeout(() => {
      setIsConfirmingStyle(false);
      setStyleConfirmed(true);
    }, 1500);
  };

  const canGenerate = phase1.selected && phase2.selected;

  return (
    <div className="space-y-6">
      {!canGenerate ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Please complete Phases 1 and 2 first</p>
          </CardContent>
        </Card>
      ) : !phase3.lecture ? (
        <Card>
          <CardHeader>
            <CardTitle>Phase 3: Lecture Generation</CardTitle>
            <CardDescription>
              Generate the full lecture manuscript based on your selections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="mb-6 border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  Upload Style Reference
                </CardTitle>
                <CardDescription>
                  Upload a markdown (.md) file to guide the lecture's writing style
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!styleMarkdown ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      styleFileName ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    }}
                    onDrop={handleStyleFileDrop}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop a markdown file here, or
                    </p>
                    <input
                      type="file"
                      accept=".md"
                      onChange={handleStyleFileSelect}
                      className="hidden"
                      id="style-file-input"
                    />
                    <label htmlFor="style-file-input">
                      <Button variant="outline" type="button" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">{styleFileName}</p>
                          <p className="text-xs text-gray-500">{styleFileSize}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetStyleMarkdown}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear
                      </Button>
                    </div>

                    {styleAnalysis && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">Style Analysis</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Tone:</span>
                            <span className="ml-2 font-medium">{styleAnalysis.tone || 'Not detected'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Style:</span>
                            <span className="ml-2 font-medium">{styleAnalysis.style || 'Not detected'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Structure:</span>
                            <span className="ml-2 font-medium">{styleAnalysis.structure || 'Not detected'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Audience:</span>
                            <span className="ml-2 font-medium">{styleAnalysis.audience || 'General'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Length:</span>
                            <span className="ml-2 font-medium">{styleAnalysis.length} words</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Preview</h4>
                      <p className="text-sm text-gray-600 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {styleMarkdown.substring(0, 1000)}
                        {styleMarkdown.length > 1000 && '...'}
                      </p>
                    </div>

                    <Button
                      onClick={confirmStyleMarkdown}
                      disabled={isConfirmingStyle || styleConfirmed}
                      className={`w-full ${styleConfirmed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      {isConfirmingStyle ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Confirming Style...
                        </>
                      ) : styleConfirmed ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Style Captured
                        </>
                      ) : (
                        'Use This Style'
                      )}
                    </Button>

                    {styleConfirmed && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Style captured successfully and will be applied to the generated lecture
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center py-8">
              <Button 
                onClick={generateLecture} 
                disabled={phase3.isGenerating}
                size="lg"
              >
                {phase3.isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Lecture... ({phase3.progress}%)</span>
                    <Timer isRunning={true} />
                  </div>
                ) : (
                  'Generate Full Lecture'
                )}
              </Button>
              {generationTime > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Generated in {Math.round(generationTime / 1000)}s</span>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p><strong>Selected Aim:</strong> {phase1.selected?.aim}</p>
                <p><strong>Selected Story:</strong> {phase2.selected?.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="lecture" className="flex-1">Lecture Manuscript</TabsTrigger>
              <TabsTrigger value="worship" className="flex-1">
                <Music className="h-4 w-4 mr-2" />
                Worship Songs
              </TabsTrigger>
              <TabsTrigger value="outline" className="flex-1">Outline</TabsTrigger>
            </TabsList>

            <TabsContent value="lecture" className="space-y-6 mt-6">
              {phase3.lecture ? (
                <>
                  {/* Title Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{phase3.lecture.title || 'Untitled'}</CardTitle>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {phase3.lecture.metadata?.totalDuration || 0} min
                        </Badge>
                      </div>
                      <CardDescription>{phase3.lecture.scriptureReference || 'No reference'}</CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Introduction */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Introduction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">
                        {phase3.lecture.introduction?.storyOpening || ''}
                      </p>
                      <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                        <p className="font-medium text-amber-800">cliffhanger</p>
                        <p className="text-sm text-amber-700">{phase3.lecture.introduction?.cliffhanger || ''}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Divisions */}
                  {(() => {
                    const body = phase3.lecture?.body;
                    let divisions: any[] = [];

                    if (Array.isArray(body)) {
                      divisions = body;
                    } else if (body && typeof body === 'object') {
                      divisions = Object.values(body).filter((item: any) =>
                        item && (item.division_number || item.title)
                      );
                    }
                    
                    return divisions.map((division, index) => {
                      console.log('Rendering division:', index, 'applications:', division.applications);
                      return (
                      <Card key={division.id || `div-${index}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Division {index + 1}: {division.title || ''}
                            </CardTitle>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setExpandedDivision(
                                expandedDivision === division.id ? null : division.id
                              )}
                            >
                              {expandedDivision === division.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <CardDescription>{division.scriptureRange || ''}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-blue-600 mb-2">Principle</h4>
                              <p className="text-lg font-medium">{division.principle || ''}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Exposition</h4>
                              <p className="text-gray-600">{division.exposition || ''}</p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-medium text-green-600 mb-3">Application Questions</h4>
                              <div className="grid gap-4 md:grid-cols-3">
                                <Card className="bg-blue-50">
                                  <CardHeader className="pb-2">
                                    <Badge variant="outline">Young Professionals</Badge>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm">{division.applications?.youngProfessionals?.question || ''}</p>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-green-50">
                                  <CardHeader className="pb-2">
                                    <Badge variant="outline">Fathers/Mid-life</Badge>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm">{division.applications?.fathersMidLife?.question || ''}</p>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-purple-50">
                                  <CardHeader className="pb-2">
                                    <Badge variant="outline">Elders</Badge>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm">{division.applications?.elders?.question || ''}</p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );});
                  })()}

                  {/* Conclusion */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Conclusion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Story Resolution */}
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">Story Resolution</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{phase3.lecture.conclusion?.storyResolution || ''}</p>
                      </div>
                      
                      {/* Call to Action - if different from story resolution */}
                      {phase3.lecture.conclusion?.callToAction !== phase3.lecture.conclusion?.storyResolution && (
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Call to Action</h4>
                          <p className="text-gray-600 whitespace-pre-wrap">{phase3.lecture.conclusion?.callToAction || ''}</p>
                        </div>
                      )}
                      
                      {/* Closing Prayer */}
                      {phase3.lecture.conclusion?.closingPrayer && (
                        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                          <h4 className="font-medium text-amber-800 mb-2">Closing Prayer</h4>
                          <p className="italic text-amber-900 whitespace-pre-wrap">{phase3.lecture.conclusion?.closingPrayer || ''}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    <p>Lecture not yet generated. Click &quot;Generate Full Lecture&quot; to begin.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="worship" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Worship Song Suggestions</CardTitle>
                  <CardDescription>
                    Songs that complement this lecture theme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {phase3.worshipSongs.length === 0 ? (
                    <p className="text-gray-500">No worship songs generated yet</p>
                  ) : (
                    <div className="space-y-4">
                      {phase3.worshipSongs.map((song, index) => (
                        <Card key={song.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{song.title}</h4>
                                <p className="text-sm text-gray-500">{song.artist} - {song.source}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{song.placement}</Badge>
                                <Badge className="bg-blue-100 text-blue-800">{song.category}</Badge>
                              </div>
                            </div>
                            <p className="text-sm mt-2 text-gray-600">
                              <strong>Why it fits:</strong> {song.thematicConnection}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outline" className="mt-6">
              {phase3.lecture ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Lecture Outline</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600">Introduction</Badge>
                          <span className="text-sm">{phase3.lecture.title || ''}</span>
                        </div>
                        
                        {phase3.lecture.body && (
                          (Array.isArray(phase3.lecture.body) 
                            ? phase3.lecture.body 
                            : Object.values(phase3.lecture.body || {}).filter((d: any) => d && d.title)
                          ).map((division: any, index: number) => (
                            <div key={division.id || `div-${index}`} className="flex items-center gap-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <span className="text-sm">{division.title || ''}</span>
                            </div>
                          ))
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600">Conclusion</Badge>
                        <span className="text-sm">Resolution & Prayer</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    <p>Outline not available. Generate a lecture first.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                useWorkflowStore.getState().clearLecture();
                useWorkflowStore.getState().setWorshipSongs([]);
                // Trigger regeneration
                generateLecture();
              }}
              disabled={phase3.isGenerating}
            >
              {phase3.isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Clear & Regenerate'
              )}
            </Button>
            
            <Button onClick={nextPhase} size="lg">
              Continue to Visual Assets
            </Button>
          </div>
          
          {/* Accept & Save Button */}
          {phase3.lecture && !phase3.isGenerating && (
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={acceptAndSaveLecture}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : savedMessage ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {savedMessage}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Accept & Save Lecture
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
