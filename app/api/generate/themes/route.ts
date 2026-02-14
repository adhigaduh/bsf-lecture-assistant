import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context?.phase1Selection || !context?.phase3Lecture) {
      return NextResponse.json(
        { error: 'Phase 1 selection and Phase 3 lecture are required' },
        { status: 400 }
      );
    }

    const themes = await aiService.generateDesignThemes({
      phase: 4,
      text: '',
      context: {
        phase1Selection: context.phase1Selection,
        phase3Lecture: context.phase3Lecture,
        settings: context.settings,
        preferences: context.preferences || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    console.error('Design themes generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate design themes' },
      { status: 500 }
    );
  }
}
