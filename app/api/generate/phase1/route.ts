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

    const options = await aiService.generateStrategicFoundation({
      phase: 1,
      text,
      context: context || undefined,
    });

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Phase 1 generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
