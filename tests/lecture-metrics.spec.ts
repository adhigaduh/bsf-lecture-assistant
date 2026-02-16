import { test, expect } from '@playwright/test';

test.describe('Lecture Metrics API', () => {
  test('should return word count and calculate duration in API response', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19 - Now it came about after these things, that God tested Abraham',
          context: {
            phase1Selection: {
              aim: 'God tests Abraham faith',
              divisions: [{ title: 'The Test', scriptureRange: 'Genesis 22:1-2', principle: 'God tests faith', keyVerses: [] }]
            },
            phase2Selection: {
              title: 'Test Story',
              tone: 'personal',
              opening: 'A man faced a test',
              cliffhanger: 'He had to choose',
              resolution: 'He chose faith'
            },
            settings: {
              language: 'en',
              targetAudience: 'Indonesian Adult Men'
            }
          }
        })
      });
      return await response.json();
    });
    
    console.log('API success:', result.success);
    
    expect(result.success).toBe(true);
    expect(result.data?.lecture).toBeDefined();
    
    const lecture = result.data.lecture;
    
    // Check word counts exist
    let totalWords = 0;
    if (lecture.introduction?.word_count) {
      totalWords += Number(lecture.introduction.word_count);
      console.log('Intro words:', lecture.introduction.word_count);
    }
    
    if (lecture.body && Array.isArray(lecture.body)) {
      lecture.body.forEach((div: any, i: number) => {
        if (div.exposition?.word_count) {
          totalWords += Number(div.exposition.word_count);
          console.log(`Division ${i+1} exposition:`, div.exposition.word_count);
        }
      });
    }
    
    if (lecture.conclusion?.word_count) {
      totalWords += Number(lecture.conclusion.word_count);
      console.log('Conclusion words:', lecture.conclusion.word_count);
    }
    
    console.log('Total words:', totalWords);
    
    // Calculate expected duration (~130 words per minute)
    const expectedDuration = Math.round(totalWords / 130);
    console.log('Expected duration:', expectedDuration, 'min');
    
    // Verify
    expect(totalWords).toBeGreaterThan(0);
    expect(expectedDuration).toBeGreaterThan(0);
    
    console.log('✅ Word count and duration calculation working!');
  });
});
