import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, context } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    if (!context?.phase1Selection) {
      return NextResponse.json(
        { error: 'Phase 1 selection is required' },
        { status: 400 }
      );
    }

    const options = await aiService.generateNarrativeArc({
      phase: 2,
      text,
      context: context || undefined,
    });

    console.log('Phase 2 generated options:', options.length);
    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Phase 2 generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Generation failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
