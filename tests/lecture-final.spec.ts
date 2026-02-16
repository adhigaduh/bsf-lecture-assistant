import { test, expect } from '@playwright/test';

test.describe('Lecture Display with New Code', () => {
  test('should display word count correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Generate lecture via API
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19',
          context: {
            phase1Selection: {
              aim: 'God tests faith',
              divisions: [{ title: 'Test', scriptureRange: 'Gen 22:1', principle: 'Test', keyVerses: [] }]
            },
            phase2Selection: {
              title: 'Story', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test'
            },
            settings: { language: 'en', targetAudience: 'Indonesian Adult Men' }
          }
        })
      });
      return await response.json();
    });
    
    // Save to workflow
    const workflowState = {
      currentUser: { id: 'test', email: 'test@test.com', name: 'Test' },
      currentPhase: 4,
      uploadedText: 'Genesis 22',
      extractedText: 'Genesis 22',
      phase1: { options: [], selected: { id: '1', aim: 'Test', divisions: [], confidenceScore: 80, reasoning: '' }, isGenerating: false, error: null },
      phase2: { options: [], selected: { id: '1', title: 'Test', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test', resonanceScore: 80, characters: [], setting: {} }, isGenerating: false, error: null },
      phase3: { lecture: result.data.lecture, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
      phase4: { visualAssets: [], isGenerating: false, error: null },
      settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'test', quickMode: false, autoSave: true, targetAudience: 'Indonesian Adult Men' }
    };
    
    await page.evaluate((state) => {
      localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state));
    }, workflowState);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Lecture button
    await page.locator('button:has-text("Lecture")').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check text content
    const text = await page.locator('body').textContent();
    console.log('Has words:', text?.includes('words'));
    console.log('Has min:', text?.includes('min'));
    
    // Look for word count pattern
    const wordCountMatch = text?.match(/(\d{1,3}(,\d{3})*)\s+words/);
    const minMatch = text?.match(/(\d+)\s+min/);
    
    console.log('Word count found:', wordCountMatch?.[1]);
    console.log('Duration found:', minMatch?.[1]);
    
    await page.screenshot({ path: 'test-screenshots/lecture-final.png' });
    
    expect(wordCountMatch).toBeTruthy();
  });
});
