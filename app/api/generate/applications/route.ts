import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { division, ageGroup, context } = body;

    if (!division || !ageGroup) {
      return NextResponse.json(
        { error: 'Division data and age group are required' },
        { status: 400 }
      );
    }

    // Generate application question for specific age group
    const result = await aiService.generateApplicationQuestion({
      division,
      ageGroup,
      context,
    });

    return NextResponse.json({
      success: true,
      question: result,
    });
  } catch (error) {
    console.error('Application generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
