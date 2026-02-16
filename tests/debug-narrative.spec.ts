import { test, expect } from '@playwright/test';

test.describe('Check Narrative in Lecture', () => {
  test('check narrative resolution in lecture', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19',
          context: {
            phase1Selection: {
              aim: 'God tests faith',
              divisions: [
                { title: 'Test', scriptureRange: 'Gen 22:1', principle: 'Test', keyVerses: [] }
              ]
            },
            phase2Selection: {
              title: 'Story',
              tone: 'personal',
              opening: 'A man faced a difficult test. He had to choose between comfort and obedience.',
              cliffhanger: 'At the mountain, something unexpected happened that would change everything.',
              resolution: 'In the end, he learned that obedience brings blessing. His faith grew stronger.'
            },
            settings: { language: 'en', targetAudience: 'Indonesian Adult Men' }
          }
        })
      });
      return await response.json();
    });
    
    const lecture = result.data?.lecture;
    console.log('=== CONCLUSION ===');
    console.log(JSON.stringify(lecture?.conclusion, null, 2));
    
    // Check for story resolution
    console.log('\n=== CHECKING ===');
    console.log('Has storyResolution:', !!lecture?.conclusion?.storyResolution);
    console.log('Has resolution:', !!lecture?.conclusion?.resolution);
    console.log('All keys in conclusion:', Object.keys(lecture?.conclusion || {}));
  });
});
