import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, textOnSlide, slideType, themeName } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    if (!textOnSlide || !textOnSlide.trim()) {
      return NextResponse.json(
        { error: 'No text provided' },
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

    // Extract base64 image data
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Build the prompt for Gemini
    const prompt = buildGeminiCompositePrompt(textOnSlide, slideType, themeName);
    
    console.log('Sending image + text to Gemini 2.0 Flash Image Generation Experimental...');
    console.log('Prompt length:', prompt.length);
    
    // Call Gemini 2.0 Flash Image Generation Experimental API with both image and text
    // This model supports image input and image output for compositing
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Gemini response received');

    // Extract the generated image from response
    let finalImageData = null;
    
    if (result.candidates && result.candidates[0]) {
      const candidate = result.candidates[0];
      
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            finalImageData = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!finalImageData) {
      return NextResponse.json({
        success: false,
        message: 'Gemini did not return an image. It may have refused to add text.',
        result: result,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      imageData: finalImageData,
      message: 'Text successfully added to image by Gemini',
    });
    
  } catch (error) {
    console.error('Gemini composite error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to composite image with text' },
      { status: 500 }
    );
  }
}

function buildGeminiCompositePrompt(textOnSlide: string, slideType?: string, themeName?: string): string {
  const lines = textOnSlide.split('\n').filter(line => line.trim());
  const mainTitle = lines[0] || '';
  const subtitle = lines[1] || '';
  const bodyText = lines.slice(2).join('\n');
  
  let slideSpecificInstructions = '';
  
  switch (slideType) {
    case 'Title':
      slideSpecificInstructions = `
SLIDE TYPE: Title Slide
PLACEMENT INSTRUCTIONS:
- Place the MAIN TITLE prominently at the TOP CENTER of the image
- Use large, elegant font for the title
- Place the subtitle/scripture reference BELOW the title, smaller font
- Keep text centered and well-spaced
- Ensure high contrast against the background`;
      break;
      
    case 'Outline':
      slideSpecificInstructions = `
SLIDE TYPE: Outline Slide
PLACEMENT INSTRUCTIONS:
- Place "Outline" as a header at the TOP LEFT
- List the items below using Roman numerals (I, II, III) or numbers
- Left-align all text
- Use consistent spacing between items
- Keep text in the LEFT portion of the image`;
      break;
      
    case 'Principle':
    case slideType?.startsWith('Principle') ? slideType : '':
      slideSpecificInstructions = `
SLIDE TYPE: Principle Slide
PLACEMENT INSTRUCTIONS:
- Place the division title at the TOP
- Place the principle statement prominently in the CENTER
- Use quotation marks around the principle
- Center-align the text
- Make the principle the focal point`;
      break;
      
    case 'Application':
    case slideType?.startsWith('Application') ? slideType : '':
      slideSpecificInstructions = `
SLIDE TYPE: Application Slide
PLACEMENT INSTRUCTIONS:
- Place "Application" header at the top
- Create three sections or columns for different age groups
- Use clear headers: "Young Professionals", "Fathers/Mid-life", "Elders"
- Space the content evenly across the slide`;
      break;
      
    case 'Memory':
    case slideType?.startsWith('Memory') ? slideType : '':
      slideSpecificInstructions = `
SLIDE TYPE: Memory Aid Slide
PLACEMENT INSTRUCTIONS:
- Place "Remember" at the top
- Center the memory aid text (mnemonic, acronym, or phrase)
- Make it visually distinct and memorable
- Center-align all text`;
      break;
      
    case 'Discussion':
      slideSpecificInstructions = `
SLIDE TYPE: Discussion Slide
PLACEMENT INSTRUCTIONS:
- Place "Discussion Questions" at the TOP CENTER
- Number the questions (1, 2, 3) below
- Left-align or center-align the questions
- Keep questions clearly separated`;
      break;
      
    case 'Summary':
      slideSpecificInstructions = `
SLIDE TYPE: Summary Slide
PLACEMENT INSTRUCTIONS:
- Place "Key Takeaways" or "Summary" at the top
- Use bullet points (✓) for main points
- Left-align the bullet points
- Place any closing quote at the bottom, italicized`;
      break;
      
    default:
      slideSpecificInstructions = `
SLIDE TYPE: General Content Slide
PLACEMENT INSTRUCTIONS:
- Place headers at the TOP
- Left-align or center-align body text
- Use proper spacing and hierarchy
- Ensure text is readable and well-positioned`;
  }

  return `You are a professional presentation designer. I have provided you with a slide background image and text content. Your task is to add the text to the image to create a professional presentation slide.

${themeName ? `THEME: ${themeName}
Use colors and style consistent with this theme.` : ''}

${slideSpecificInstructions}

TEXT CONTENT TO ADD:
---
${textOnSlide}
---

CRITICAL REQUIREMENTS:
1. Add ALL the text provided above to the image
2. Use elegant, readable fonts (serif fonts like Georgia or Times New Roman work well)
3. Ensure HIGH CONTRAST between text and background
4. Add text shadows or subtle background behind text if needed for readability
5. Maintain the original background image's visual elements
6. Keep text within the image boundaries (don't let it go off the edges)
7. Use appropriate font sizes: large for titles, medium for headers, smaller for body text
8. Space the text properly - not too crowded, not too sparse
9. Professional, church/lecture appropriate styling

The result should look like a professionally designed presentation slide with the text elegantly integrated into the background image.

Generate the final slide image with the text added.`;
}
