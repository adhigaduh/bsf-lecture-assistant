import { test, expect } from '@playwright/test';

test.describe('Story Resolution Display', () => {
  test('check story resolution in API and UI', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Generate with specific narrative that has resolution
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19',
          context: {
            phase1Selection: {
              aim: 'God tests faith through trials',
              divisions: [{ title: 'Test', scriptureRange: 'Gen 22:1', principle: 'God tests faith', keyVerses: [] }]
            },
            phase2Selection: {
              title: 'The Test of Faith',
              tone: 'personal',
              opening: 'Pak Hadi was a successful businessman in Jakarta. He had built his company from scratch and provided well for his family.',
              cliffhanger: 'But then God asked him to do something that seemed impossible - to let go of his biggest blessing.',
              resolution: 'In the end, Pak Hadi learned that God honors those who trust Him completely. His faith grew stronger and his family drew closer to God.'
            },
            settings: { language: 'en', targetAudience: 'Indonesian Adult Men' }
          }
        })
      });
      const data = await response.json();
      return {
        hasResolution: !!data.data?.lecture?.conclusion?.storyResolution,
        storyResolution: data.data?.lecture?.conclusion?.storyResolution?.substring(0, 100),
        keys: Object.keys(data.data?.lecture?.conclusion || {})
      };
    });
    
    console.log('API result:', JSON.stringify(result, null, 2));
  });
});
