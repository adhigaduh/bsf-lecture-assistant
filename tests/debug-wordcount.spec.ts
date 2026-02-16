import { test, expect } from '@playwright/test';

test.describe('Debug Word Count', () => {
  test('check lecture structure full', async ({ page }) => {
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
              title: 'Story', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test'
            },
            settings: { language: 'en', targetAudience: 'Test' }
          }
        })
      });
      return {
        status: response.status,
        json: await response.json()
      };
    });
    
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.json, null, 2).substring(0, 2000));
  });
});
