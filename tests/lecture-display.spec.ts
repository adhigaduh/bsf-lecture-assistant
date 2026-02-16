import { test, expect } from '@playwright/test';

test.describe('Lecture Word Count Display', () => {
  test('should display word count on Lecture page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/', { timeout: 15000 });
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Generate lecture via API
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19 - God tested Abraham',
          context: {
            phase1Selection: {
              aim: 'God tests faith',
              divisions: [
                { title: 'The Test', scriptureRange: 'Genesis 22:1-2', principle: 'God tests faith', keyVerses: [] },
                { title: 'Obedience', scriptureRange: 'Genesis 22:3-10', principle: 'Faith obeys', keyVerses: [] },
                { title: 'Provision', scriptureRange: 'Genesis 22:11-19', principle: 'God provides', keyVerses: [] }
              ]
            },
            phase2Selection: {
              title: 'Test Story', tone: 'personal', opening: 'A man faced a test', cliffhanger: 'Would he obey?', resolution: 'He chose faith'
            },
            settings: { language: 'en', targetAudience: 'Indonesian Adult Men' }
          }
        })
      });
      return await response.json();
    });
    
    console.log('Generation success:', result.success);
    
    if (result.success && result.data?.lecture) {
      const lecture = result.data.lecture;
      console.log('Lecture keys:', Object.keys(lecture));
      console.log('Introduction keys:', lecture.introduction ? Object.keys(lecture.introduction) : 'none');
      console.log('Body length:', lecture.body?.length);
      if (lecture.body?.[0]) {
        console.log('Body[0] keys:', Object.keys(lecture.body[0]));
      }
      
      // Save to localStorage and test UI
      const workflowState = {
        currentUser: { id: 'test', email: 'test@test.com', name: 'Test' },
        currentPhase: 4,
        uploadedText: 'Genesis 22',
        extractedText: 'Genesis 22',
        phase1: { options: [], selected: { id: '1', aim: 'Test', divisions: [], confidenceScore: 80, reasoning: '' }, isGenerating: false, error: null },
        phase2: { options: [], selected: { id: '1', title: 'Test', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test', resonanceScore: 80, characters: [], setting: {} }, isGenerating: false, error: null },
        phase3: { lecture: lecture, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
        phase4: { visualAssets: [], isGenerating: false, error: null },
        settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'test', quickMode: false, autoSave: true, targetAudience: 'Test' }
      };
      
      await page.evaluate((state) => {
        localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state));
      }, workflowState);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Click Lecture button
      const lectureBtn = page.locator('button:has-text("Lecture")');
      await lectureBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for badges
      const bodyText = await page.locator('body').textContent();
      console.log('Has "words":', bodyText?.includes('words'));
      console.log('Has "min":', bodyText?.includes('min'));
      
      // Get all badge texts
      const badges = await page.locator('[class*="badge"]').all();
      console.log('Badge count:', badges.length);
      for (const badge of badges) {
        console.log('Badge:', await badge.textContent());
      }
      
      await page.screenshot({ path: 'test-screenshots/lecture-display.png' });
    }
  });
});
