import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, textOnSlide, slideType } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Step 1: Generate clean background with Gemini
    const backgroundPrompt = buildBackgroundPrompt(prompt, slideType);
    
    console.log('Generating background with Gemini...');
    const backgroundImageData = await generateBackgroundWithGemini(backgroundPrompt, apiKey);
    
    if (!backgroundImageData) {
      return NextResponse.json(
        { error: 'Failed to generate background image' },
        { status: 500 }
      );
    }

    // Step 2: If text is provided, composite it on top using Canvas
    let finalImageData = backgroundImageData;
    
    if (textOnSlide && textOnSlide.trim().length > 0) {
      console.log('Adding text overlay with Canvas API...');
      try {
        finalImageData = await addTextOverlay(backgroundImageData, textOnSlide, slideType);
        console.log('Text overlay added successfully');
      } catch (textError) {
        console.error('Error adding text overlay:', textError);
        // Return background without text if overlay fails
        finalImageData = backgroundImageData;
      }
    }

    return NextResponse.json({
      success: true,
      imageData: finalImageData,
      prompt: backgroundPrompt,
      hasTextOverlay: !!textOnSlide && textOnSlide.trim().length > 0,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}

function buildBackgroundPrompt(prompt: string, slideType?: string): string {
  const aspectRatioInstruction = `Create a widescreen 16:9 presentation slide background (1920x1080 pixels, landscape orientation).`;
  
  let slideTypeInstructions = '';
  switch (slideType) {
    case 'Title':
      slideTypeInstructions = 'Title slide: Elegant imagery with space at top for main title and bottom for subtitle/scripture. Keep center relatively clear.';
      break;
    case 'Outline':
      slideTypeInstructions = 'Outline slide: Clean design with space on left or center for a bulleted list.';
      break;
    case 'Application':
      slideTypeInstructions = 'Application slide: Imagery with space for three columns of text.';
      break;
    default:
      if (slideType?.startsWith('Principle')) {
        slideTypeInstructions = 'Principle slide: Visual metaphor with space at top for title and center for principle statement.';
      } else if (slideType?.startsWith('Memory')) {
        slideTypeInstructions = 'Memory slide: Symbolic imagery with space for mnemonic text.';
      }
  }

  return `${aspectRatioInstruction}

${slideTypeInstructions}

BACKGROUND DESCRIPTION:
${prompt}

CRITICAL: Generate a clean background with NO TEXT, NO WORDS, NO LETTERS. The text will be added separately.`;
}

async function generateBackgroundWithGemini(prompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + apiKey,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();

  // Extract image from response
  if (result.candidates && result.candidates[0]) {
    const candidate = result.candidates[0];
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
  }

  return null;
}

async function addTextOverlay(
  backgroundImageData: string,
  textOnSlide: string,
  slideType?: string
): Promise<string> {
  // Parse the base64 image
  const base64Data = backgroundImageData.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Load image with canvas
  const image = await loadImage(buffer);
  
  // Create canvas with same dimensions
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.drawImage(image, 0, 0);
  
  const width = image.width;
  const height = image.height;
  
  // Parse text content
  const lines = textOnSlide.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length === 0) return canvas.toDataURL('image/png');
  
  // Professional slide design configuration
  const config = getSlideConfig(slideType, width, height, lines);
  
  // Create gradient overlay for text area
  drawGradientOverlay(ctx, config, width, height);
  
  // Render text with professional typography
  ctx.textAlign = config.textAlign as CanvasTextAlign;
  ctx.textBaseline = 'top';
  
  let currentY = config.startY;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isFirstLine = i === 0;
    const isLastLine = i === lines.length - 1;
    
    // Determine styling based on content type
    const style = getLineStyle(line, isFirstLine, config, slideType);
    
    // Calculate wrapped lines
    const wrappedLines = wrapText(ctx, line, style.font, config.maxWidth);
    
    for (let j = 0; j < wrappedLines.length; j++) {
      const text = wrappedLines[j];
      const x = config.textAlign === 'center' ? width / 2 : config.marginLeft;
      
      // Draw text with professional effects
      drawProfessionalText(ctx, text, x, currentY, style);
      
      currentY += style.lineHeight;
    }
    
    // Add extra spacing after certain line types
    if (line.match(/^\d+\./) || line.match(/^I{1,3}\./i) || line.includes(':')) {
      currentY += config.paragraphSpacing;
    }
  }
  
  return canvas.toDataURL('image/png');
}

function getSlideConfig(slideType: string | undefined, width: number, height: number, lines: string[]) {
  const marginX = width * 0.1;
  const marginY = height * 0.12;
  const contentWidth = width - (marginX * 2);
  
  const configs: Record<string, any> = {
    Title: {
      marginLeft: width / 2,
      marginRight: marginX,
      startY: height * 0.35,
      maxWidth: contentWidth * 0.8,
      textAlign: 'center',
      baseFontSize: Math.min(56, height * 0.065),
      lineHeight: height * 0.09,
      paragraphSpacing: height * 0.04,
      gradientPosition: 'center',
      titleDivider: true
    },
    Outline: {
      marginLeft: marginX * 1.5,
      marginRight: marginX,
      startY: height * 0.22,
      maxWidth: contentWidth * 0.85,
      textAlign: 'left',
      baseFontSize: Math.min(32, height * 0.04),
      lineHeight: height * 0.065,
      paragraphSpacing: height * 0.015,
      gradientPosition: 'left',
      bulletStyle: 'roman'
    },
    Application: {
      marginLeft: marginX,
      marginRight: marginX,
      startY: height * 0.18,
      maxWidth: contentWidth,
      textAlign: 'left',
      baseFontSize: Math.min(28, height * 0.035),
      lineHeight: height * 0.055,
      paragraphSpacing: height * 0.02,
      gradientPosition: 'full',
      columnLayout: true
    },
    Discussion: {
      marginLeft: width / 2,
      marginRight: marginX,
      startY: height * 0.25,
      maxWidth: contentWidth * 0.8,
      textAlign: 'center',
      baseFontSize: Math.min(36, height * 0.045),
      lineHeight: height * 0.075,
      paragraphSpacing: height * 0.025,
      gradientPosition: 'center'
    },
    Summary: {
      marginLeft: marginX * 1.3,
      marginRight: marginX,
      startY: height * 0.2,
      maxWidth: contentWidth * 0.8,
      textAlign: 'left',
      baseFontSize: Math.min(30, height * 0.038),
      lineHeight: height * 0.06,
      paragraphSpacing: height * 0.018,
      gradientPosition: 'full',
      bulletChar: '✓'
    },
    Principle: {
      marginLeft: width / 2,
      marginRight: marginX,
      startY: height * 0.3,
      maxWidth: contentWidth * 0.75,
      textAlign: 'center',
      baseFontSize: Math.min(40, height * 0.05),
      lineHeight: height * 0.08,
      paragraphSpacing: height * 0.03,
      gradientPosition: 'center',
      quoteStyle: true
    },
    Memory: {
      marginLeft: width / 2,
      marginRight: marginX,
      startY: height * 0.32,
      maxWidth: contentWidth * 0.7,
      textAlign: 'center',
      baseFontSize: Math.min(38, height * 0.048),
      lineHeight: height * 0.075,
      paragraphSpacing: height * 0.025,
      gradientPosition: 'center',
      boxed: true
    }
  };
  
  // Determine config based on slide type
  let configKey = 'Title';
  if (slideType?.startsWith('Principle')) configKey = 'Principle';
  else if (slideType?.startsWith('Memory')) configKey = 'Memory';
  else if (slideType && configs[slideType]) configKey = slideType;
  
  return configs[configKey];
}

function getLineStyle(line: string, isFirstLine: boolean, config: any, slideType?: string) {
  const isHeader = isFirstLine && !line.match(/^\d+\./) && !line.match(/^I{1,3}\./i);
  const isScripture = line.match(/^\d+:\d+/);
  const isQuote = line.startsWith('"') || line.startsWith('"');
  const isBullet = line.match(/^[•\-\*✓]/) || line.match(/^\d+\./) || line.match(/^I{1,3}\./i);
  
  let fontSize = config.baseFontSize;
  let fontWeight = '400';
  let color = '#FAFAFA';
  let letterSpacing = '0';
  
  if (isHeader) {
    fontSize = config.baseFontSize * 1.2;
    fontWeight = '600';
    color = '#FFFFFF';
    letterSpacing = '0.5px';
  } else if (isQuote) {
    fontSize = config.baseFontSize * 0.95;
    fontWeight = '400';
    color = '#F0F0F0';
    letterSpacing = '0.3px';
  } else if (isScripture) {
    fontSize = config.baseFontSize * 0.85;
    color = '#E0E0E0';
  } else if (isBullet) {
    fontSize = config.baseFontSize * 0.92;
  }
  
  return {
    font: `${fontWeight} ${fontSize}px "Georgia", "Times New Roman", serif`,
    fontSize,
    color,
    letterSpacing,
    lineHeight: config.lineHeight,
    isHeader
  };
}

function drawGradientOverlay(ctx: any, config: any, width: number, height: number) {
  let gradient;
  
  switch (config.gradientPosition) {
    case 'center':
      // Center vignette for title slides
      gradient = ctx.createRadialGradient(width/2, height/2, height * 0.2, width/2, height/2, height * 0.8);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      break;
      
    case 'left':
      // Left-to-right gradient for outline slides
      gradient = ctx.createLinearGradient(0, 0, width * 0.6, 0);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      break;
      
    case 'full':
    default:
      // Full overlay with more transparency
      gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function wrapText(ctx: any, text: string, font: string, maxWidth: number): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function drawProfessionalText(ctx: any, text: string, x: number, y: number, style: any) {
  ctx.font = style.font;
  
  // Draw multi-layer shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillText(text, x + 3, y + 3);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillText(text, x + 2, y + 2);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillText(text, x + 1, y + 1);
  
  // Main text
  ctx.fillStyle = style.color;
  ctx.fillText(text, x, y);
  
  // Subtle highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillText(text, x - 0.5, y - 0.5);
}


