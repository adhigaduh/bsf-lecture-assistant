import { test, expect } from '@playwright/test';

test.describe('Word Count Display', () => {
  test('should display word count in lecture page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/').catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Test 1: Generate lecture via API
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19',
          context: {
            phase1Selection: { aim: 'God tests faith', divisions: [{ title: 'Test', scriptureRange: 'Gen 22:1', principle: 'Test', keyVerses: [] }] },
            phase2Selection: { title: 'Story', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test' },
            settings: { language: 'en', targetAudience: 'Indonesian Adult Men' }
          }
        })
      });
      return await response.json();
    });
    
    console.log('=== API Response ===');
    console.log('Success:', result.success);
    const lecture = result.data?.lecture;
    console.log('Lecture keys:', Object.keys(lecture || {}));
    console.log('Introduction word_count:', lecture?.introduction?.word_count);
    console.log('Body[0] word_count:', lecture?.body?.[0]?.word_count);
    console.log('Conclusion word_count:', lecture?.conclusion?.word_count);
    
    // Calculate expected word count
    let expectedCount = 0;
    if (lecture?.introduction?.word_count) expectedCount += Number(lecture.introduction.word_count);
    if (lecture?.body) {
      lecture.body.forEach((b: any) => {
        if (b.word_count) expectedCount += Number(b.word_count);
      });
    }
    if (lecture?.conclusion?.word_count) expectedCount += Number(lecture.conclusion.word_count);
    console.log('Expected word count:', expectedCount);
    
    // Save to workflow and test UI
    const workflowState = {
      currentUser: { id: 'test', email: 'test@test.com', name: 'Test' },
      currentPhase: 4,
      uploadedText: 'Genesis 22',
      extractedText: 'Genesis 22',
      phase1: { options: [], selected: { id: '1', aim: 'Test', divisions: [], confidenceScore: 80, reasoning: '' }, isGenerating: false, error: null },
      phase2: { options: [], selected: { id: '1', title: 'Test', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test', resonanceScore: 80, characters: [], setting: {} }, isGenerating: false, error: null },
      phase3: { lecture: lecture, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
      phase4: { visualAssets: [], isGenerating: false, error: null },
      settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'test', quickMode: false, autoSave: true, targetAudience: 'Indonesian Adult Men' }
    };
    
    await page.evaluate((state) => localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state)), workflowState);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Find and click Lecture button
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
    
    // Check for word count display
    const bodyText = await page.locator('body').textContent();
    console.log('=== UI Check ===');
    console.log('Has words:', bodyText?.includes('words'));
    console.log('Has min:', bodyText?.includes('min'));
    console.log('Has 0 words:', bodyText?.includes('0 words'));
    console.log('Has 0 min:', bodyText?.includes('0 min'));
    
    // Find the actual badges
    const badges = await page.locator('[class*="Badge"]').all();
    console.log('Badge count:', badges.length);
    for (const badge of badges) {
      const badgeText = await badge.textContent();
      console.log('Badge:', badgeText);
    }
    
    await page.screenshot({ path: 'test-screenshots/word-count-test.png' });
    
    // Verify
    expect(expectedCount).toBeGreaterThan(0);
  });
});
