import { test, expect } from '@playwright/test';

// Test to verify Gemini provider integration works for Phase 4 visual generation
// This test assumes GOOGLE_API_KEY is set in environment
// To run with Gemini: Set ai_providers.active to "gemini" in config.yaml

test.describe('Gemini Visual Generation', () => {
  test('Phase 4 visual assets generation works', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    const sampleText = `
Matthew 5:1-12

Blessed are the poor in spirit, for theirs is the kingdom of heaven.
Blessed are those who mourn, for they will be comforted.
Blessed are the meek, for they will inherit the earth.
    `.trim();

    // Monitor API responses
    let phase4ResponseData: any = null;
    page.on('response', async response => {
      if (response.url().includes('/api/generate/phase4')) {
        try {
          phase4ResponseData = await response.json();
          console.log('Phase 4 API Response:', JSON.stringify(phase4ResponseData, null, 2));
        } catch (e) {
          console.log('Failed to parse Phase 4 response');
        }
      }
    });

    // Login
    console.log('STEP: Login');
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // New Lecture
    const newLectureBtn = page.locator('button:has-text("New Lecture")');
    if (await newLectureBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newLectureBtn.click();
      await page.waitForTimeout(1000);
    }

    // Phase 1: Upload
    console.log('STEP: Upload text');
    await page.fill('textarea#manual-text', sampleText);
    await page.click('button:has-text("Use This Text")');
    await expect(page.locator('text=characters ready')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Phase 2: Strategy
    console.log('STEP: Generate Strategic Foundation');
    await page.click('button:has-text("Generate Strategic Foundation Options")');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Generated in') || document.body.innerText.includes('Option 1');
    }, { timeout: 120000 });
    await page.waitForTimeout(2000);
    
    // Select first option
    await page.locator('text=Option 1').first().click();
    await page.waitForTimeout(1000);
    const acceptBtn = page.locator('button:has-text("Accept & Continue")');
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Phase 3: Narrative
    console.log('STEP: Generate Bookend Story');
    await page.click('button:has-text("Generate Bookend Story Options")');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Generated in') || document.body.innerText.includes('Resonance');
    }, { timeout: 180000 });
    await page.waitForTimeout(2000);
    
    // Select first story
    await page.locator('text=Option 1').first().click();
    await page.waitForTimeout(1000);
    const acceptBtn2 = page.locator('button:has-text("Accept & Continue")');
    if (await acceptBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn2.click();
      await page.waitForTimeout(1000);
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Phase 4: Lecture
    console.log('STEP: Generate Full Lecture');
    await page.click('button:has-text("Generate Full Lecture")');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Lecture Manuscript');
    }, { timeout: 300000 });
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Phase 5: Visuals - THE KEY TEST FOR GEMINI
    console.log('STEP: Generate Design Themes');
    await page.click('button:has-text("Generate Design Themes")');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Theme 1');
    }, { timeout: 60000 });
    await page.waitForTimeout(2000);

    // Select theme
    const themeCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: 'Theme 1' }).first();
    await themeCard.click();
    await page.waitForTimeout(1000);

    // Proceed to generate visual assets
    console.log('STEP: Generate Visual Assets');
    await page.click('button:has-text("Proceed with This Theme")');

    // Wait for generation
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return (text.includes('Visual Assets Generated') && !text.includes('Generating Slides')) ||
             text.includes('Regenerate Prompts');
    }, { timeout: 120000 });

    await page.waitForTimeout(2000);

    // Verify visual assets were generated
    const assetsText = page.locator('text=Visual Assets Generated');
    await expect(assetsText).toBeVisible({ timeout: 5000 });
    const assetsLabel = await assetsText.textContent();
    console.log(`RESULT: ${assetsLabel}`);

    // Extract count
    const countMatch = assetsLabel?.match(/(\d+)\s*Visual Assets Generated/);
    const assetCount = countMatch ? parseInt(countMatch[1]) : 0;
    console.log(`RESULT: Generated ${assetCount} visual assets`);
    
    // Validate
    expect(assetCount).toBeGreaterThan(0);
    expect(phase4ResponseData?.success).toBe(true);
    expect(Array.isArray(phase4ResponseData?.data)).toBe(true);
    expect(phase4ResponseData?.data?.length).toBeGreaterThan(0);

    console.log('========================================');
    console.log('GEMINI VISUAL GENERATION TEST PASSED');
    console.log(`  Visual assets: ${assetCount}`);
    console.log(`  API success: ${phase4ResponseData?.success}`);
    console.log('========================================');
  });
});
