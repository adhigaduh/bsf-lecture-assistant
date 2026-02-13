import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { WorshipSong } from '@/types/workflow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, context, styleMarkdown }: { text: string; context: any; styleMarkdown?: string } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    if (!context?.phase1Selection || !context?.phase2Selection) {
      return NextResponse.json(
        { error: 'Phase 1 and Phase 2 selections are required' },
        { status: 400 }
      );
    }

    const lecture = await aiService.generateLecture({
      phase: 3,
      text,
      context: context || undefined,
      styleMarkdown: styleMarkdown || undefined,
    });

    let worshipSongs: WorshipSong[] = [];
    try {
      worshipSongs = await aiService.generateWorshipSongs({
        phase: 3,
        text,
        context: context || undefined,
      });
    } catch (songError) {
      console.warn('Worship songs generation skipped:', songError);
      worshipSongs = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        lecture,
        worshipSongs,
      },
    });
  } catch (error) {
    console.error('Phase 3 generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Generation failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
