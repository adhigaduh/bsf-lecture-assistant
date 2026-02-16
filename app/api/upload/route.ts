import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let extractedText = '';

    if (fileExtension === 'pdf') {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `pdf-${Date.now()}-${fileName}`);
      
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
      
      try {
        const pythonScriptPath = path.join(tempDir, `extract-${Date.now()}.py`);
        const pythonScript = `import sys
import io
import pdfplumber

# Force UTF-8 output for cross-platform compatibility
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pdf_path = sys.argv[1]
text_parts = []
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)

if text_parts:
    print(chr(10).join(text_parts))
else:
    print("No text found", file=sys.stderr)
    sys.exit(1)
`;
        fs.writeFileSync(pythonScriptPath, pythonScript);
        
        try {
          const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonScriptPath}" "${tempFilePath}"`);
          
          if (stdout && stdout.trim()) {
            extractedText = stdout;
          } else if (stderr && stderr.includes('Error')) {
            throw new Error(stderr);
          }
        } finally {
          try { fs.unlinkSync(pythonScriptPath); } catch {}
        }
      } catch (pythonError) {
        console.log('Python extraction failed:', pythonError);
        extractedText = '';
      } finally {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }
      
      if (!extractedText || extractedText.length < 50) {
        return NextResponse.json({
          success: true,
          data: {
            fileName,
            extractedText: `[PDF FILE: ${fileName}]\n\nThis PDF may be a scanned image. For best results:\n\n1. Copy text from your PDF reader and paste below, OR\n2. Export your PDF as text (.txt) and re-upload`,
          },
        });
      }
      
      if (extractedText.length > 15000) {
        extractedText = extractedText.substring(0, 15000) + '\n\n...[text truncated for processing]';
      }
    } else if (fileExtension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
    } else if (fileExtension === 'txt') {
      extractedText = await file.text();
    } else {
      return NextResponse.json(
        { error: `Unsupported file format: .${fileExtension}. Please use PDF, DOCX, or TXT` },
        { status: 400 }
      );
    }

    extractedText = extractedText
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')       // Limit blank lines to max 2
      .replace(/\t+/g, ' ')             // Replace tabs with space
      .replace(/[ ]+(?=\n)/g, '')       // Remove trailing spaces before newlines
      .trim();

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        extractedText,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'File processing failed' },
      { status: 500 }
    );
  }
}
