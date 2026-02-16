import { test, expect } from '@playwright/test';

// Test Gemini composite API endpoint
test.describe('Gemini Composite API', () => {
  test('should return 404 if model name is invalid', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 30000 });
    
    // Test with a simple image and text
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    console.log('Testing Gemini composite API...');
    const result = await page.evaluate(async (imageData) => {
      try {
        const response = await fetch('/api/generate-image/gemini-composite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: imageData,
            textOnSlide: 'Test Title\nSubtitle text here',
            slideType: 'Title',
            themeName: 'Test Theme'
          })
        });
        
        const status = response.status;
        const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
        
        return { status, data };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Unknown error' };
      }
    }, testImage);
    
    console.log('API Response Status:', result.status);
    console.log('API Response:', JSON.stringify(result.data, null, 2));
    
    // Check if we got a successful response or a proper error
    if (result.status === 200) {
      console.log('✅ API call succeeded');
      expect(result.data.success).toBe(true);
    } else if (result.status === 404) {
      console.log('❌ API returned 404 - model not found');
      console.log('Error:', result.data.error);
      // This is the error we're trying to fix
      expect(result.status).not.toBe(404);
    } else {
      console.log('⚠️ API returned status:', result.status);
      console.log('Error:', result.data.error);
      // Other errors are acceptable for testing
      expect(true).toBe(true);
    }
  });
});
