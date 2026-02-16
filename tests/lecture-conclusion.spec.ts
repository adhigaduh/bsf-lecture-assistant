import { test, expect } from '@playwright/test';

test.describe('Story Resolution in UI', () => {
  test('check if story resolution shows in lecture page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/').catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Create lecture with story resolution
    const mockLecture = {
      title: 'Test Lecture',
      scriptureReference: 'Genesis 22:1-19',
      introduction: { storyOpening: 'Test', cliffhanger: 'Test', transitionToText: 'Test', word_count: 10 },
      body: [{ id: '1', title: 'Div 1', scriptureRange: 'Gen 22:1', principle: 'Test', exposition: 'Test', applications: {}, transitions: '', word_count: 10 }],
      conclusion: {
        storyResolution: 'This is the story resolution from the narrative - Pak Hadi learned that God is faithful.',
        callToAction: 'Trust God in your trials.',
        closingPrayer: 'Lord, help us trust you.',
        finalThought: 'Remember God is faithful.',
        word_count: 50
      }
    };
    
    const workflowState = {
      currentUser: { id: 'test', email: 'test@test.com', name: 'Test' },
      currentPhase: 4,
      uploadedText: 'Genesis 22',
      extractedText: 'Genesis 22',
      phase1: { options: [], selected: { id: '1', aim: 'Test', divisions: [], confidenceScore: 80, reasoning: '' }, isGenerating: false, error: null },
      phase2: { options: [], selected: { id: '1', title: 'Test', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test resolution', resonanceScore: 80, characters: [], setting: {} }, isGenerating: false, error: null },
      phase3: { lecture: mockLecture, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
      phase4: { visualAssets: [], isGenerating: false, error: null },
      settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'test', quickMode: false, autoSave: true, targetAudience: 'Test' }
    };
    
    await page.evaluate((state) => localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state)), workflowState);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click Lecture button
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text?.includes('Lecture')) {
        await btn.click();
        break;
      }
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check page content
    const text = await page.locator('body').textContent();
    console.log('Has Story Resolution:', text?.includes('Story Resolution'));
    console.log('Has story resolution text:', text?.includes('Pak Hadi'));
    console.log('Has Conclusion:', text?.includes('Conclusion'));
    console.log('Has Call to Action:', text?.includes('Call to Action'));
    
    // Look for the actual content
    const hasResolutionContent = await page.locator('text=Pak Hadi learned').isVisible().catch(() => false);
    console.log('Has resolution content visible:', hasResolutionContent);
    
    await page.screenshot({ path: 'test-screenshots/lecture-conclusion.png' });
  });
});
