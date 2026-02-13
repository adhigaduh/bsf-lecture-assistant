'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Download, FileText, File, Upload, Save } from 'lucide-react';
import { exportToMarkdown } from '@/lib/export/markdown';
import { exportToPowerPoint } from '@/lib/export/pptx';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { 
    settings, 
    updateSettings, 
    phase1, 
    phase2, 
    phase3, 
    phase4,
    resetWorkflow
  } = useWorkflowStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportMarkdown = async () => {
    if (!phase3.lecture) return;
    
    setIsExporting(true);
    try {
      const markdown = exportToMarkdown(
        phase3.lecture,
        phase4.visualAssets,
        phase3.worshipSongs
      );
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${phase3.lecture.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToServer = async () => {
    if (!phase3.lecture) return;
    
    setIsExporting(true);
    try {
      const markdown = exportToMarkdown(
        phase3.lecture,
        phase4.visualAssets,
        phase3.worshipSongs
      );
      
      const response = await fetch('/api/save-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          fileName: phase3.lecture.title
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save lecture');
      }
      
      const result = await response.json();
      alert(`Lecture saved to: ${result.filePath}`);
    } catch (error) {
      console.error('Error saving lecture:', error);
      alert('Failed to save lecture to server');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPowerPoint = async () => {
    if (!phase3.lecture) return;
    
    setIsExporting(true);
    try {
      const buffer = await exportToPowerPoint(
        phase3.lecture,
        phase4.visualAssets,
        phase3.worshipSongs
      );
      
      const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${phase3.lecture.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pptx`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!phase3.lecture) return;
    
    const data = {
      lecture: phase3.lecture,
      worshipSongs: phase3.worshipSongs,
      visualAssets: phase4.visualAssets,
      strategicFoundation: phase1.selected,
      narrativeArc: phase2.selected,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${phase3.lecture.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[600px] max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Settings & Export</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">AI Settings</TabsTrigger>
              <TabsTrigger value="export" className="flex-1">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Interface Language</Label>
                    <p className="text-sm text-gray-500">Choose your preferred language</p>
                  </div>
                  <Select 
                    value={settings.language} 
                    onValueChange={(value) => updateSettings({ language: value as 'en' | 'id' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Save</Label>
                    <p className="text-sm text-gray-500">Automatically save your progress</p>
                  </div>
                  <Switch 
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Quick Mode</Label>
                    <p className="text-sm text-gray-500">Skip option selection for faster workflow</p>
                  </div>
                  <Switch 
                    checked={settings.quickMode}
                    onCheckedChange={(checked) => updateSettings({ quickMode: checked })}
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to start over? All progress will be lost.')) {
                        resetWorkflow();
                        onClose();
                      }
                    }}
                  >
                    Start New Lecture
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label>AI Provider</Label>
                  <p className="text-sm text-gray-500 mb-2">Choose your AI provider</p>
                  <Select 
                    value={settings.aiProvider} 
                    onValueChange={(value) => updateSettings({ aiProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> API keys must be set in your .env.local file.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Required: OPENAI_API_KEY or ANTHROPIC_API_KEY
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-4">
              {!phase3.lecture ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Generate a lecture first to export</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Export Options</Label>
                    <p className="text-sm text-gray-500 mb-4">Download your lecture in various formats</p>
                    
                    <div className="grid gap-3">
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={handleExportMarkdown}
                        disabled={isExporting}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export as Markdown (.md)
                        <span className="ml-auto text-xs text-gray-500">Full manuscript</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={handleSaveToServer}
                        disabled={isExporting}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save to Server
                        <span className="ml-auto text-xs text-gray-500">lectures/ folder</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={handleExportPowerPoint}
                        disabled={isExporting}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Export as PowerPoint (.pptx)
                        <span className="ml-auto text-xs text-gray-500">Presentation slides</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={handleExportJSON}
                      >
                        <File className="h-4 w-4 mr-2" />
                        Export as JSON (.json)
                        <span className="ml-auto text-xs text-gray-500">All data + settings</span>
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        alert('Google Docs export requires OAuth setup. See documentation.');
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Export to Google Docs
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
