'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2, File, CheckCircle, AlertCircle } from 'lucide-react';

export function FileUploader() {
  const { uploadedText, fileName, setUploadedText, clearUploadedText } = useWorkflowStore();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [manualText, setManualText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show warning if text was loaded from localStorage
  const isResumed = uploadedText.length > 0 && manualText.length === 0 && statusMessage === null;

  // Clear manualText when starting new upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setStatusMessage(null);
    setManualText(''); // Clear previous text
    setUploadedFileName(file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const text = result.data.extractedText;
        setStatusMessage('Text extracted successfully!');
        setStatusType('success');
        setManualText(text);
        setUploadedFileName(result.data.fileName);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Failed to process file'}`);
      setStatusType('error');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleManualInput = () => {
    const textToUse = manualText.trim() || uploadedText.trim();
    if (textToUse) {
      setUploadedText(textToUse, uploadedFileName || 'Manual Input');
      setStatusMessage('✓ Text ready! Click Next to continue.');
      setStatusType('success');
    }
  };

  const clearAll = () => {
    clearUploadedText();
    setManualText('');
    setStatusMessage(null);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Lesson Material</CardTitle>
          <CardDescription>
            Upload a PDF, DOCX, or text file containing the biblical passage or lesson material
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
                <p className="text-gray-600 font-medium">Extracting text...</p>
              </div>
            ) : (
              <>
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-4 font-medium">
                  Drag and drop your file here
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <Button size="lg" onClick={triggerFileInput} type="button">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: PDF, DOCX, TXT
                </p>
                
                {statusMessage && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start justify-center gap-2 text-left ${
                    statusType === 'error' ? 'bg-red-50 text-red-700' :
                    statusType === 'success' ? 'bg-green-50 text-green-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {statusType === 'error' ? (
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm">{statusMessage}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Extracted Text</CardTitle>
          <CardDescription>
            {uploadedFileName 
              ? `From: ${uploadedFileName}`
              : 'Paste or type your lesson material below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Textarea
                id="manual-text"
                placeholder="Extracted text will appear here. Paste your lesson material if needed..."
                className="min-h-[300px] mt-1 font-sans"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleManualInput}
                disabled={(!manualText.trim() && !uploadedText.trim()) || isUploading}
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use This Text
              </Button>
              <Button 
                variant="outline" 
                onClick={clearAll}
                size="lg"
              >
                Clear
              </Button>
            </div>
            {manualText && (
              <p className="text-sm text-gray-500">
                {manualText.length} characters
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedText && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {uploadedText.length} characters ready
                  </p>
                  <p className="text-sm text-green-600">
                    Source: {fileName}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
