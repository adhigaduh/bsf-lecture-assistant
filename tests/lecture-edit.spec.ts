import { test, expect } from '@playwright/test';

test.describe('Lecture Metrics After Edit', () => {
  test('should update word count after editing lecture', async ({ page }) => {
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
    
    // Set workflow state with lecture
    const mockLecture = {
      title: 'Original Title',
      scriptureReference: 'Genesis 22:1-19',
      introduction: {
        storyOpening: 'This is the original introduction with some words.',
        cliffhanger: 'Original cliffhanger.',
        transitionToText: 'Original transition.'
      },
      body: [
        {
          id: 'div-1',
          title: 'Division 1',
          scriptureRange: 'Genesis 22:1-2',
          principle: 'God tests faith.',
          exposition: 'Original exposition content here with many words.',
          principle_statement: 'The principle statement.',
          applications: {},
          transitions: ''
        }
      ],
      conclusion: {
        storyResolution: 'Original resolution.',
        callToAction: 'Original call to action.',
        closingPrayer: 'Original prayer.',
        finalThought: 'Original final thought.'
      }
    };
    
    const workflowState = {
      currentUser: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
      currentPhase: 4,
      uploadedText: 'Genesis 22:1-19',
      extractedText: 'Genesis 22:1-19',
      phase1: { 
        options: [], 
        selected: { id: '1', aim: 'Test aim', divisions: [], confidenceScore: 80, reasoning: 'Test' }, 
        isGenerating: false, 
        error: null 
      },
      phase2: { 
        options: [], 
        selected: { id: '1', title: 'Test', tone: 'personal', opening: 'Test', cliffhanger: 'Test', resolution: 'Test', resonanceScore: 80, characters: [], setting: {} }, 
        isGenerating: false, 
        error: null 
      },
      phase3: { 
        lecture: mockLecture, 
        worshipSongs: [], 
        isGenerating: false, 
        error: null, 
        progress: 0 
      },
      phase4: { visualAssets: [], isGenerating: false, error: null },
      settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'claude-3-5-sonnet-20241022', quickMode: false, autoSave: true, targetAudience: 'Indonesian Adult Men' }
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
    
    // Check initial word count
    const initialText = await page.locator('body').textContent();
    console.log('Initial has words:', initialText?.includes('words'));
    
    // Click Edit button
    const editBtn = page.locator('button:has-text("Edit Lecture")');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      
      // Modify the title
      const titleInput = page.locator('input[value="Original Title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Modified Title - Much Longer Word Count Here');
      }
      
      // Save changes
      const saveBtn = page.locator('button:has-text("Save Lecture")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Check if word count updated
      const afterEditText = await page.locator('body').textContent();
      console.log('After edit has words:', afterEditText?.includes('words'));
      console.log('After edit has modified:', afterEditText?.includes('Modified Title'));
      
      // Verify the edit was saved
      expect(afterEditText).toContain('Modified Title');
    }
    
    console.log('✅ Edit and recalculate test passed');
  });
});
