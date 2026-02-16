import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// Detect if running on Windows
const isWindows = os.platform() === 'win32';

// Get the appropriate Python command for the platform
function getPythonCommand(): string {
  if (isWindows) {
    // On Windows, try python first, then py
    return 'python';
  }
  return 'python3';
}

// Escape file path for shell command (Windows-safe)
function escapePath(filePath: string): string {
  if (isWindows) {
    // On Windows, wrap in quotes and escape any internal quotes
    return `"${filePath.replace(/"/g, '""')}"`;
  }
  // On Unix, use single quotes to prevent shell interpretation
  return `'${filePath.replace(/'/g, "'\"'\'")}'`;
}

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
        const pythonScript = `# -*- coding: utf-8 -*-
import sys
import io
import pdfplumber

# Force UTF-8 output for cross-platform compatibility
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

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
        fs.writeFileSync(pythonScriptPath, pythonScript, 'utf-8');
        
        try {
          const pythonCmd = getPythonCommand();
          const scriptPathEscaped = escapePath(pythonScriptPath);
          const tempFilePathEscaped = escapePath(tempFilePath);
          const { stdout, stderr } = await execAsync(`${pythonCmd} ${scriptPathEscaped} ${tempFilePathEscaped}`, {
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large PDFs
          });
          
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
        extractedText = await extractTextFallback(Buffer.from(arrayBuffer));
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

// Fallback PDF text extraction with Unicode support
async function extractTextFallback(buffer: Buffer): Promise<string> {
  // Convert buffer to string with UTF-8 encoding to preserve Unicode
  let content: string;
  try {
    // Try UTF-8 first
    content = buffer.toString('utf-8');
  } catch {
    // Fallback to Latin-1 (ISO-8859-1) which preserves all byte values
    content = buffer.toString('latin1');
  }
  
  // Try to find text between parentheses (common PDF text encoding)
  const textMatches = content.match(/\((?:[^\)]*)\)/g) || [];
  
  const textParts = textMatches
    .map(t => {
      let decoded = t.replace(/^\(|\)$/g, '');
      // Decode common PDF escape sequences
      decoded = decoded
        .replace(/\\(\d{3})/g, (_, octal) => {
          try {
            return String.fromCharCode(parseInt(octal, 8));
          } catch {
            return _;
          }
        })
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      return decoded.trim();
    })
    .filter(t => t.length > 2 && !t.match(/^[\d\s\/\[\]{}<>]+$/))
    .filter(t => t.length > 3);
  
  // Join with proper Unicode handling
  return textParts.join(' ');
}
