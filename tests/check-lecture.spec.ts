import { test, expect } from '@playwright/test';

test.describe('Check Lecture Tab Content', () => {
  test('verify lecture content displays', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/').catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const mockLecture = {
      title: 'God Tests Faith',
      scriptureReference: 'Genesis 22:1-19',
      introduction: { storyOpening: 'Opening story here', cliffhanger: 'Cliffhanger text', transitionToText: 'Transition', word_count: 10 },
      body: [{ id: '1', title: 'Division 1', scriptureRange: 'Gen 22:1', principle: 'Principle', exposition: 'Exposition', applications: {}, transitions: '', word_count: 10 }],
      conclusion: { storyResolution: 'Resolution story', callToAction: 'Call to action', closingPrayer: 'Prayer', finalThought: 'Final', word_count: 50 }
    };
    
    const workflowState = {
      currentUser: { id: 'test', email: 'test@test.com', name: 'Test' },
      currentPhase: 4,
      uploadedText: 'Genesis 22',
      extractedText: 'Genesis 22',
      phase1: { options: [], selected: { id: '1', aim: 'Test', divisions: [], confidenceScore: 80, reasoning: '' }, isGenerating: false, error: null },
      phase2: { options: [], selected: { id: '1', title: 'Test', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test', resonanceScore: 80, characters: [], setting: {} }, isGenerating: false, error: null },
      phase3: { lecture: mockLecture, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
      phase4: { visualAssets: [], isGenerating: false, error: null },
      settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'test', quickMode: false, autoSave: true, targetAudience: 'Test' }
    };
    
    await page.evaluate((state) => localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state)), workflowState);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Try to find and click Lecture button in sidebar
    const nav = page.locator('nav, aside').first();
    const lectureLink = nav.locator('button:has-text("Lecture")').or(page.locator('button:has-text("Lecture")').first());
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Get all visible text
    const body = await page.locator('body');
    const text = await body.textContent();
    console.log('Body length:', text?.length);
    console.log('Has God Tests Faith:', text?.includes('God Tests Faith'));
    console.log('Has Introduction:', text?.includes('Introduction'));
    console.log('Has Conclusion:', text?.includes('Conclusion'));
    console.log('Has Resolution:', text?.includes('Resolution'));
    
    // Check for any card elements
    const cards = await page.locator('[class*="Card"]').count();
    console.log('Card count:', cards);
    
    await page.screenshot({ path: 'test-screenshots/check-lecture.png' });
  });
});
