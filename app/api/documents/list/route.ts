import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');

// Ensure documents directory exists
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const userDocsDir = path.join(DOCUMENTS_DIR, userId);
    
    if (!fs.existsSync(userDocsDir)) {
      return NextResponse.json({ documents: [] });
    }

    const files = fs.readdirSync(userDocsDir).filter(f => f.endsWith('.json'));
    const documents = files.map(file => {
      const filePath = path.join(userDocsDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content;
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'Failed to load documents' },
      { status: 500 }
    );
  }
}
