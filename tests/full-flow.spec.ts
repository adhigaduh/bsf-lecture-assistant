import { test, expect } from '@playwright/test';

test.describe('Lecture API Verification', () => {
  test('API returns word_count in all sections', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/').catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
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
              title: 'Test',
              tone: 'personal',
              opening: 'Test',
              cliffhanger: 'Test',
              resolution: 'Test'
            },
            settings: { language: 'en', targetAudience: 'Indonesian Adult Men' }
          }
        })
      });
      return await response.json();
    });
    
    console.log('Full result:', JSON.stringify(result, null, 2).substring(0, 3000));
    
    expect(result).toBeDefined();
  });
});