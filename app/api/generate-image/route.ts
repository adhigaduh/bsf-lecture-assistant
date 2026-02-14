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

    if (textOnSlide) {
      fullPrompt = `Create a 16:9 aspect ratio presentation slide.

BACKGROUND: ${prompt}

TEXT TO DISPLAY ON SLIDE (overlay this text clearly and elegantly):
${textOnSlide}

DESIGN REQUIREMENTS:
- 16:9 aspect ratio (1920x1080 pixels)
- Text must be clearly readable with good contrast
- Use elegant typography appropriate for a church/lecture setting
- Leave appropriate space for text - don't clutter
- Background should complement but not compete with text
- Use professional, clean design aesthetic`;

      if (slideType === 'Title') {
        fullPrompt += `\n- Title should be prominent and centered
- "BSF Lecture" should appear as a subtle label
- Include scripture reference below title`;
      } else if (slideType === 'Outline') {
        fullPrompt += `\n- Use Roman numerals (I, II, III) for list items
- Clean, minimalist layout for easy reading
- Include scripture references in parentheses`;
      } else if (slideType === 'Application') {
        fullPrompt += `\n- Three-column layout for the three age groups
- Clear headers for each age group
- Balanced composition`;
      }
    } else {
      fullPrompt = `Create a 16:9 aspect ratio presentation slide image.

IMAGE DESCRIPTION: ${prompt}

REQUIREMENTS:
- 16:9 aspect ratio (1920x1080 pixels)
- Professional presentation quality
- Suitable for church/lecture setting`;
    }

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
