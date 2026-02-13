import PptxGenJS from 'pptxgenjs';
import { Lecture, VisualAsset, WorshipSong } from '@/types/workflow';

export async function exportToPowerPoint(
  lecture: Lecture,
  visualAssets: VisualAsset[] = [],
  worshipSongs: WorshipSong[] = []
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.title = lecture.title;
  pptx.subject = 'BSF Lecture';
  pptx.author = 'BSF Lecture Assistant';
  pptx.layout = 'LAYOUT_16x9';

  // Define colors
  const colors = {
    primary: '2563EB',
    secondary: '64748B',
    accent: 'F59E0B',
    text: '333333',
    background: 'FFFFFF',
  };

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(lecture.title, {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: colors.primary,
    align: 'center',
  });
  titleSlide.addText(lecture.scriptureReference, {
    x: 0.5,
    y: 4,
    w: '90%',
    h: 0.5,
    fontSize: 18,
    color: colors.secondary,
    align: 'center',
  });

  // Worship Songs Slide (if available)
  if (worshipSongs.length > 0) {
    const songsSlide = pptx.addSlide();
    songsSlide.addText('Worship Songs', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.primary,
    });
    
    worshipSongs.forEach((song, index) => {
      songsSlide.addText(`${index + 1}. ${song.title} - ${song.artist}`, {
        x: 0.5,
        y: 1.5 + (index * 0.8),
        w: '90%',
        h: 0.6,
        fontSize: 16,
        color: colors.text,
      });
      songsSlide.addText(`   (${song.placement} - ${song.category})`, {
        x: 0.5,
        y: 1.9 + (index * 0.8),
        w: '90%',
        h: 0.4,
        fontSize: 12,
        color: colors.secondary,
      });
    });
  }

  // Division Slides
  lecture.body.forEach((division, divIndex) => {
    // Section Title Slide
    const sectionSlide = pptx.addSlide();
    sectionSlide.addText(`Division ${divIndex + 1}: ${division.title}`, {
      x: 0.5,
      y: 2,
      w: '90%',
      h: 1,
      fontSize: 36,
      bold: true,
      color: colors.primary,
      align: 'center',
    });
    sectionSlide.addText(division.scriptureRange, {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.5,
      fontSize: 18,
      color: colors.secondary,
      align: 'center',
    });

    // Content Slide
    const contentSlide = pptx.addSlide();
    
    // Principle
    contentSlide.addText('Principle', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: colors.accent,
    });
    contentSlide.addText(division.principle, {
      x: 0.5,
      y: 1.0,
      w: '90%',
      h: 1.0,
      fontSize: 18,
      color: colors.text,
    });

    // Applications
    contentSlide.addText('Application Questions', {
      x: 0.5,
      y: 2.2,
      w: '90%',
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: colors.accent,
    });
    
    contentSlide.addText(`Young Professionals: ${division.applications.youngProfessionals.question}`, {
      x: 0.5,
      y: 2.8,
      w: '90%',
      h: 0.7,
      fontSize: 12,
      color: colors.text,
    });
    
    contentSlide.addText(`Fathers/Mid-life: ${division.applications.fathersMidLife.question}`, {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.7,
      fontSize: 12,
      color: colors.text,
    });
    
    contentSlide.addText(`Elders: ${division.applications.elders.question}`, {
      x: 0.5,
      y: 4.2,
      w: '90%',
      h: 0.7,
      fontSize: 12,
      color: colors.text,
    });
  });

  // Conclusion Slide
  const conclusionSlide = pptx.addSlide();
  conclusionSlide.addText('Conclusion', {
    x: 0.5,
    y: 0.5,
    w: '90%',
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary,
  });
  conclusionSlide.addText(lecture.conclusion.callToAction, {
    x: 0.5,
    y: 1.5,
    w: '90%',
    h: 1.5,
    fontSize: 18,
    color: colors.text,
  });
  conclusionSlide.addText(lecture.conclusion.closingPrayer, {
    x: 0.5,
    y: 3.5,
    w: '90%',
    h: 1.5,
    fontSize: 14,
    italic: true,
    color: colors.secondary,
  });

  // Visual Assets Slide (if available)
  if (visualAssets.length > 0) {
    const visualSlide = pptx.addSlide();
    visualSlide.addText('Visual Asset Prompts (for AI Image Generation)', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: colors.primary,
    });

    visualAssets.slice(0, 4).forEach((asset, index) => {
      visualSlide.addText(`${asset.slideSection}: ${asset.textOnSlide}`, {
        x: 0.5,
        y: 1.5 + (index * 1.5),
        w: '90%',
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: colors.text,
      });
      visualSlide.addText(`Prompt: ${asset.visualPrompt}`, {
        x: 0.5,
        y: 1.9 + (index * 1.5),
        w: '90%',
        h: 1.0,
        fontSize: 10,
        color: colors.secondary,
      });
    });
  }

  // Generate and return as buffer
  const buffer = await pptx.write({ compression: true }) as Buffer;
  return buffer;
}
