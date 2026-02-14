import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context?.phase1Selection) {
      return NextResponse.json(
        { error: 'Phase 1 selection is required' },
        { status: 400 }
      );
    }

    const visualAssets = await aiService.generateVisualAssets({
      phase: 4,
      text: '',
      context: context || undefined,
    }, context.selectedTheme);

    return NextResponse.json({
      success: true,
      data: visualAssets,
    });
  } catch (error) {
    console.error('Phase 4 generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
