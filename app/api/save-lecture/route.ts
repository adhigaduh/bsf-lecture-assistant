import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdown, fileName } = body;

    if (!markdown) {
      return NextResponse.json(
        { error: 'No markdown content provided' },
        { status: 400 }
      );
    }

    // Create lectures directory if it doesn't exist
    const lecturesDir = path.join(process.cwd(), 'lectures');
    if (!fs.existsSync(lecturesDir)) {
      fs.mkdirSync(lecturesDir, { recursive: true });
    }

    // Generate filename
    const safeName = fileName 
      ? fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      : `lecture-${Date.now()}`;
    const fullPath = path.join(lecturesDir, `${safeName}.md`);

    // Write the file
    fs.writeFileSync(fullPath, markdown, 'utf-8');

    return NextResponse.json({
      success: true,
      filePath: fullPath,
      fileName: `${safeName}.md`
    });
  } catch (error) {
    console.error('Error saving lecture:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save lecture' },
      { status: 500 }
    );
  }
}
