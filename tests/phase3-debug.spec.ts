import { test, expect } from '@playwright/test';

// Debug test to identify Phase 3 generation failures
test.describe('Phase 3 Debug', () => {
  test('should log detailed error information', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 30000 });
    
    // Listen to all console logs from the browser
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
    });
    
    // Call Phase 3 API directly with test data
    console.log('Calling Phase 3 API...');
    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/generate/phase3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Genesis 22:1-19 - The testing of Abraham',
            context: {
              phase1Selection: {
                aim: 'God tests faith to strengthen it',
                divisions: [
                  { 
                    title: 'The Test', 
                    scriptureRange: 'Genesis 22:1-2', 
                    principle: 'God tests our faith to refine it',
                    keyVerses: ['Genesis 22:1']
                  },
                  { 
                    title: 'The Response', 
                    scriptureRange: 'Genesis 22:3-10', 
                    principle: 'True faith obeys immediately',
                    keyVerses: ['Genesis 22:3']
                  }
                ]
              },
              phase2Selection: {
                title: 'A Father Tested',
                opening: 'Abraham received a command that would shatter any parent',
                cliffhanger: 'What would he do when faced with the impossible?',
                resolution: 'He trusted God and received the promise fulfilled'
              },
              settings: { 
                language: 'en', 
                targetAudience: 'Indonesian Adult Men',
                aiProvider: 'anthropic'
              }
            }
          })
        });
        
        const status = response.status;
        const data = await response.json().catch(() => ({ error: 'Failed to parse JSON' }));
        
        return { status, data };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
      }
    });
    
    console.log('API Response Status:', result.status);
    console.log('API Response:', JSON.stringify(result.data, null, 2));
    
    // Check if it succeeded or failed
    if (result.status === 200) {
      console.log('SUCCESS: Phase 3 generation completed');
      expect(result.data.success).toBe(true);
      expect(result.data.data.lecture).toBeDefined();
    } else {
      console.log('FAILED: Phase 3 generation failed');
      console.log('Error:', result.data.error);
      console.log('Details:', result.data.details);
      // Don't fail the test - we want to see the error
      expect(true).toBe(true);
    }
  });
});
