import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

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
      console.error('Google AI error:', errorText);
      return NextResponse.json(
        { error: `Google API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Google AI response keys:', Object.keys(result));
    console.log('Google AI response:', JSON.stringify(result).substring(0, 500));

    // Extract image from response
    let imageData = null;
    
    if (result.candidates && result.candidates[0]) {
      const candidate = result.candidates[0];
      
      // Check for inline image
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageData = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      // Check for text as well (model might respond with text description)
      if (candidate.content?.parts) {
        const textPart = candidate.content.parts.find((p: any) => p.text);
        if (textPart?.text) {
          console.log('Model text response:', textPart.text);
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
      prompt: prompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
