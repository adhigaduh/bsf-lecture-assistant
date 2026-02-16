import { test, expect } from '@playwright/test';

// Full E2E: Upload -> Strategy -> Narrative -> Lecture -> Visuals
// Uses real AI calls, needs long timeout
test.describe('Full Workflow E2E', () => {

  const sampleText = `
Matthew 5:1-12

Now when he saw the crowds, he went up on a mountainside and sat down.
His disciples came to him, and he began to teach them.

He said: Blessed are the poor in spirit, for theirs is the kingdom of heaven.
Blessed are those who mourn, for they will be comforted.
Blessed are the meek, for they will inherit the earth.
Blessed are those who hunger and thirst for righteousness, for they will be filled.
Blessed are the merciful, for they will be shown mercy.
Blessed are the pure in heart, for they will see the Lord.
Blessed are the peacemakers, for they will be called children of the Lord.

Therefore, whatever you want men to do to you, do also to them,
for this is the Law and the Prophets.
  `.trim();

  test('New Lecture through all phases to Visual Assets', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes for all AI calls

    // Override actionTimeout for this long-running test
    page.setDefaultTimeout(300000);

    // ========== LOGIN ==========
    console.log('STEP: Login');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 30000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click "New Lecture" to ensure clean state
    const newLectureBtn = page.locator('button:has-text("New Lecture")');
    if (await newLectureBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('STEP: Clicking New Lecture to reset');
      await newLectureBtn.click();
      await page.waitForTimeout(1000);
    }

    // ========== PHASE 1: UPLOAD ==========
    console.log('STEP: Phase 1 - Upload text');
    await page.waitForSelector('textarea#manual-text', { timeout: 10000 });
    await page.fill('textarea#manual-text', sampleText);
    await page.click('button:has-text("Use This Text")');

    // Verify text accepted
    await expect(page.locator('text=characters ready')).toBeVisible({ timeout: 10000 });
    console.log('STEP: Text uploaded successfully');

    // Navigate to Phase 2 (Strategy)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ========== PHASE 2: STRATEGY (Phase1StrategicFoundation) ==========
    console.log('STEP: Phase 2 - Generate Strategic Foundation');
    const genStrategyBtn = page.locator('button:has-text("Generate Strategic Foundation Options")');
    await expect(genStrategyBtn).toBeVisible({ timeout: 10000 });
    await genStrategyBtn.click();

    // Wait for generation to complete (look for "Generated in" text)
    console.log('STEP: Waiting for Strategy generation (up to 120s)...');
    await page.waitForFunction(() => {
      const el = document.body.innerText;
      return el.includes('Generated in') || el.includes('Option 1');
    }, { timeout: 120_000 });

    // Wait a bit for UI to settle
    await page.waitForTimeout(2000);

    // Verify options appeared
    await expect(page.locator('text=Option 1').first()).toBeVisible({ timeout: 5000 });
    console.log('STEP: Strategy options generated');

    // Click first option card to enter edit mode
    const option1Card = page.locator('text=Option 1').first();
    await option1Card.click();
    await page.waitForTimeout(1000);

    // Check if edit mode appeared, then accept
    const acceptBtn = page.locator('button:has-text("Accept & Continue")');
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('STEP: Edit mode - clicking Accept & Continue');
      await acceptBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify selection confirmed
    await expect(page.locator('text=Strategic Foundation Selected')).toBeVisible({ timeout: 10000 });
    console.log('STEP: Strategic Foundation selected');

    // Navigate to Phase 3 (Narrative)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ========== PHASE 3: NARRATIVE (Phase2NarrativeArc) ==========
    console.log('STEP: Phase 3 - Generate Bookend Story');
    const genNarrativeBtn = page.locator('button:has-text("Generate Bookend Story Options")');
    await expect(genNarrativeBtn).toBeVisible({ timeout: 10000 });
    await genNarrativeBtn.click();

    // Wait for generation
    console.log('STEP: Waiting for Narrative generation (up to 180s)...');
    await page.waitForFunction(() => {
      const el = document.body.innerText;
      return el.includes('Generated in') || el.includes('Resonance');
    }, { timeout: 180_000 });

    await page.waitForTimeout(2000);

    // Verify options
    const storyOption = page.locator('text=Option 1').first();
    await expect(storyOption).toBeVisible({ timeout: 5000 });
    console.log('STEP: Narrative options generated');

    // Click first story option
    await storyOption.click();
    await page.waitForTimeout(1000);

    // Accept edit if in edit mode
    const acceptBtn2 = page.locator('button:has-text("Accept & Continue")');
    if (await acceptBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('STEP: Edit mode - clicking Accept & Continue');
      await acceptBtn2.click();
      await page.waitForTimeout(1000);
    }

    // Verify selection
    await expect(page.locator('text=Narrative Arc Selected')).toBeVisible({ timeout: 10000 });
    console.log('STEP: Narrative Arc selected');

    // Navigate to Phase 4 (Lecture)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ========== PHASE 4: LECTURE (Phase3LectureGeneration) ==========
    console.log('STEP: Phase 4 - Generate Full Lecture');
    const genLectureBtn = page.locator('button:has-text("Generate Full Lecture")');
    await expect(genLectureBtn).toBeVisible({ timeout: 10000 });
    await genLectureBtn.click();

    // Wait for lecture generation (longest phase)
    console.log('STEP: Waiting for Lecture generation (up to 300s)...');
    await page.waitForFunction(() => {
      const el = document.body.innerText;
      return el.includes('Lecture Manuscript') && el.includes('Introduction');
    }, { timeout: 300_000 });

    await page.waitForTimeout(3000);

    // ---- VALIDATE FIX 1: Word count should NOT be 0 ----
    console.log('STEP: Validating word count fix...');
    const wordsBadge = page.locator('text=/\\d+ words/').first();
    await expect(wordsBadge).toBeVisible({ timeout: 5000 });
    const wordsText = await wordsBadge.textContent();
    console.log(`RESULT: Word count badge text: "${wordsText}"`);

    // Extract the number from "X words" or "X,XXX words"
    const wordsMatch = wordsText?.match(/([\d,]+)\s*words/);
    const wordCount = wordsMatch ? parseInt(wordsMatch[1].replace(',', '')) : 0;
    console.log(`RESULT: Parsed word count: ${wordCount}`);
    expect(wordCount).toBeGreaterThan(0);
    console.log('PASS: Word count is > 0');

    // ---- VALIDATE FIX 1b: Duration should NOT be "0 min" ----
    const durationBadge = page.locator('text=/\\d+ min/').first();
    await expect(durationBadge).toBeVisible({ timeout: 5000 });
    const durationText = await durationBadge.textContent();
    console.log(`RESULT: Duration badge text: "${durationText}"`);
    expect(durationText).not.toContain('0 min');
    console.log('PASS: Duration is not 0 min');

    // ---- VALIDATE FIX 2: Story Resolution should be visible ----
    console.log('STEP: Validating story resolution fix...');
    const storyResolution = page.locator('text=Story Resolution');
    await expect(storyResolution).toBeVisible({ timeout: 5000 });

    // Get the story resolution content (the paragraph after the heading)
    const resolutionContent = page.locator('h4:has-text("Story Resolution") + p');
    if (await resolutionContent.isVisible({ timeout: 3000 }).catch(() => false)) {
      const resolutionText = await resolutionContent.textContent();
      console.log(`RESULT: Story resolution length: ${resolutionText?.length || 0} chars`);
      expect(resolutionText?.length).toBeGreaterThan(10);
      console.log('PASS: Story resolution has content');
    } else {
      // Try the sibling approach
      const resSection = page.locator('div:has(> h4:has-text("Story Resolution")) > p');
      const resText = await resSection.first().textContent().catch(() => '');
      console.log(`RESULT: Story resolution (alt selector) length: ${resText?.length || 0} chars`);
      expect(resText?.length).toBeGreaterThan(10);
      console.log('PASS: Story resolution has content');
    }

    console.log('STEP: Lecture phase complete, navigating to Visuals');

    // Navigate to Phase 5 (Visuals)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ========== PHASE 5: VISUALS (Phase4VisualAssets) ==========
    console.log('STEP: Phase 5 - Generate Design Themes');
    const genThemesBtn = page.locator('button:has-text("Generate Design Themes")');
    await expect(genThemesBtn).toBeVisible({ timeout: 10000 });
    await genThemesBtn.click();

    // Wait for themes
    console.log('STEP: Waiting for Theme generation (up to 60s)...');
    await page.waitForFunction(() => {
      const el = document.body.innerText;
      return el.includes('Theme 1');
    }, { timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Select first theme by clicking the Card that contains "Theme 1"
    console.log('STEP: Selecting first theme');
    const themeCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: 'Theme 1' }).first();
    await expect(themeCard).toBeVisible({ timeout: 5000 });
    await themeCard.click();
    await page.waitForTimeout(1000);

    // Verify theme is selected (should show "Selected" badge)
    await expect(page.locator('text=Selected').first()).toBeVisible({ timeout: 3000 });
    console.log('STEP: Theme selected, clicking Proceed');

    // Listen for ALL console messages during generation
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error' || text.includes('Phase 4') || text.includes('visual') || text.includes('generation')) {
        console.log(`BROWSER [${msg.type()}]: ${text.substring(0, 500)}`);
      }
    });

    // Also listen for dialog (alert) popups
    page.on('dialog', async dialog => {
      console.log(`DIALOG [${dialog.type()}]: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // Monitor Phase 4 API response
    const phase4ResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/generate/phase4'),
      { timeout: 120000 }
    ).catch(e => {
      console.log('NOTE: No phase4 API call detected within timeout');
      return null;
    });

    // Click "Proceed with This Theme"
    const proceedBtn = page.locator('button:has-text("Proceed with This Theme")');
    await expect(proceedBtn).toBeVisible({ timeout: 5000 });
    await proceedBtn.click();

    // Wait for visual assets generation - either success or the generating state ends
    console.log('STEP: Waiting for Visual Assets generation (up to 120s)...');
    await page.waitForFunction(() => {
      const el = document.body.innerText;
      // Check for either generated assets or error state
      return (el.includes('Visual Assets Generated') && !el.includes('Generating Slides')) ||
             el.includes('Regenerate Prompts');
    }, { timeout: 120000 });

    await page.waitForTimeout(2000);

    // Check the Phase 4 API response
    const phase4Response = await phase4ResponsePromise;
    if (phase4Response) {
      console.log(`PHASE4 API status: ${phase4Response.status()}`);
      try {
        const body = await phase4Response.json();
        console.log(`PHASE4 API success: ${body.success}`);
        console.log(`PHASE4 API data type: ${typeof body.data}, isArray: ${Array.isArray(body.data)}, length: ${body.data?.length}`);
        if (body.error) console.log(`PHASE4 API error: ${body.error}`);
      } catch (e) {
        console.log(`PHASE4 API body parse error: ${e}`);
      }
    } else {
      console.log('WARNING: Phase 4 API was never called!');
    }

    // Verify visual assets generated
    const assetsText = page.locator('text=Visual Assets Generated');
    await expect(assetsText).toBeVisible({ timeout: 5000 });
    const assetsLabel = await assetsText.textContent();
    console.log(`RESULT: ${assetsLabel}`);

    // Extract count
    const countMatch = assetsLabel?.match(/(\d+)\s*Visual Assets Generated/);
    const assetCount = countMatch ? parseInt(countMatch[1]) : 0;
    console.log(`RESULT: Generated ${assetCount} visual assets`);
    expect(assetCount).toBeGreaterThan(0);

    console.log('========================================');
    console.log('ALL PHASES COMPLETE - FULL E2E PASSED');
    console.log(`  Word count: ${wordCount} words`);
    console.log(`  Duration: ${durationText}`);
    console.log(`  Visual assets: ${assetCount}`);
    console.log('========================================');
  });
});
