import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, lectureData } = body;

    if (!documentId || !lectureData) {
      return NextResponse.json(
        { error: 'Document ID and lectureData are required' },
        { status: 400 }
      );
    }

    // Find the document by searching all user directories
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
            // Update the document
            content.lectureData = lectureData;
            content.updatedAt = new Date();
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            
            return NextResponse.json({
              success: true,
              document: content,
            });
          }
        } catch (e) {
          // Skip invalid JSON files
          continue;
        }
      }
    }

    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
