import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const userDirs = fs.readdirSync(DOCUMENTS_DIR);
    
    for (const userDir of userDirs) {
      const userDocsPath = path.join(DOCUMENTS_DIR, userDir);
      const files = fs.existsSync(userDocsPath) ? fs.readdirSync(userDocsPath) : [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(userDocsPath, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          if (content.id === documentId) {
            fs.unlinkSync(filePath);
            
            return NextResponse.json({
              success: true,
              message: 'Document deleted',
            });
          }
        } catch (e) {
          continue;
        }
      }
    }

    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
