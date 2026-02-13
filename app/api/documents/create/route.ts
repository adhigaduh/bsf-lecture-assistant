import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');

// Ensure documents directory exists
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      );
    }

    const documentId = crypto.randomUUID();
    const userDocsDir = path.join(DOCUMENTS_DIR, userId);
    
    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDocsDir)) {
      fs.mkdirSync(userDocsDir, { recursive: true });
    }

    const document: any = {
      id: documentId,
      userId,
      name,
      description: description || '',
      lectureData: {
        currentPhase: 1,
        uploadedText: '',
        extractedText: '',
        fileName: '',
        phase1: { options: [], selected: null, isGenerating: false, error: null },
        phase2: { options: [], selected: null, isGenerating: false, error: null },
        phase3: { lecture: null, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
        phase4: { visualAssets: [], isGenerating: false, error: null },
        settings: { language: 'en', aiProvider: 'anthropic', aiModel: '', quickMode: false, autoSave: true },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filePath = path.join(userDocsDir, `${documentId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(document, null, 2));

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
