'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Trash2, FolderOpen, LogOut, User } from 'lucide-react';

export function DocumentPanel() {
  const { 
    currentUser, 
    documents, 
    currentDocumentId,
    loadDocuments,
    createDocument,
    saveCurrentDocument,
    loadDocument,
    deleteDocument,
    switchToDocument,
    logout
  } = useWorkflowStore();

  const [newDocName, setNewDocName] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadDocuments();
    } else {
      // Redirect to login if not logged in
      window.location.href = '/login';
    }
  }, [currentUser, loadDocuments]);

  const handleCreateDocument = async () => {
    if (!newDocName.trim()) return;

    setIsCreating(true);
    try {
      await createDocument(newDocName, newDocDesc);
      setNewDocName('');
      setNewDocDesc('');
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadDocument = async (docId: string) => {
    try {
      await loadDocument(docId);
      switchToDocument(docId);
      window.location.href = '/'; // Go to main application
    } catch (error) {
      console.error('Failed to load document:', error);
      alert('Failed to load document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(docId);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Documents</CardTitle>
            <p className="text-sm text-gray-500">
              {currentUser.name} ({currentUser.email})
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new document */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-2">Create New Document</h4>
          <div className="space-y-2">
            <Input
              placeholder="Document name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              disabled={isCreating}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newDocDesc}
              onChange={(e) => setNewDocDesc(e.target.value)}
              disabled={isCreating}
              rows={2}
            />
            <Button
              onClick={handleCreateDocument}
              disabled={isCreating || !newDocName.trim()}
              size="sm"
            >
              {isCreating ? (
                <>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Document List */}
        <div>
          <h4 className="font-medium mb-2">Saved Documents</h4>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No documents yet</p>
                <p className="text-sm">Create your first document to get started</p>
              </div>
            ) : (
              documents.map((doc) => (
                <Card
                  key={doc.id}
                  className={`cursor-pointer border-2 transition-colors ${
                    currentDocumentId === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleLoadDocument(doc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <h5 className="font-medium text-gray-900">{doc.name}</h5>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentDocumentId === doc.id && (
                          <span className="text-xs text-blue-600 font-medium">Current</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
