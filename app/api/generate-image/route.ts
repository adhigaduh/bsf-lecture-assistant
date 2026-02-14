import { NextRequest, NextResponse } from 'next/server';

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

    // Build the full prompt with text overlay instructions
    let fullPrompt = prompt;

    // Always start with aspect ratio requirement
    const aspectRatioInstruction = `IMPORTANT: Generate an image with EXACTLY 16:9 aspect ratio (1920x1080 pixels, landscape orientation). This is for a presentation slide.`;

    if (textOnSlide) {
      fullPrompt = `${aspectRatioInstruction}

Create a presentation slide with the following background:
${prompt}

TEXT TO DISPLAY ON SLIDE (overlay this text clearly):
${textOnSlide}

DESIGN REQUIREMENTS:
- EXACT 16:9 aspect ratio - landscape orientation
- Text must be clearly readable with good contrast
- Elegant typography for church/lecture setting
- Leave space for text overlay
- Professional, clean design`;

      if (slideType === 'Title') {
        fullPrompt += `\n\nTITLE SLIDE:
- Main title prominent and centered
- "BSF Lecture" as a subtle label/tag
- Scripture reference below title`;
      } else if (slideType === 'Outline') {
        fullPrompt += `\n\nOUTLINE SLIDE:
- Use Roman numerals (I, II, III) for list items
- Clean, minimalist layout
- Scripture references in parentheses`;
      } else if (slideType === 'Application') {
        fullPrompt += `\n\nAPPLICATION SLIDE:
- Three-column layout for age groups
- Headers: Young Professionals | Fathers/Mid-life | Elders
- Balanced composition`;
      } else if (slideType?.startsWith('Principle')) {
        fullPrompt += `\n\nPRINCIPLE SLIDE:
- Division title at top
- Principle statement prominently displayed
- Visual metaphor background`;
      }
    } else {
      fullPrompt = `${aspectRatioInstruction}

Create a presentation slide background:
${prompt}

REQUIREMENTS:
- EXACT 16:9 aspect ratio (1920x1080)
- Professional quality
- Church/lecture appropriate`;
    }

    console.log('Image generation prompt:', fullPrompt.substring(0, 500));

    // Call Google Gemini 2.5 Flash Image API
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
            parts: [{ text: fullPrompt }]
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
      console.error('Google AI error:', errorText);
      return NextResponse.json(
        { error: `Google API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Google AI response keys:', Object.keys(result));

    // Extract image from response
    let imageData = null;

    if (result.candidates && result.candidates[0]) {
      const candidate = result.candidates[0];

      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageData = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!imageData) {
      return NextResponse.json({
        success: true,
        message: 'Image generation may be in progress or not supported',
        result: result,
      });
    }

    return NextResponse.json({
      success: true,
      imageData: imageData,
      prompt: fullPrompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
