import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase 3 - Markdown Style Upload (Full Workflow)', () => {
  const styleFilePath = path.join(__dirname, '../../styles/Ramsden Method 9_30.md');
  const sampleText = `
Genesis 22:1-19

The Lord tested Abraham and said to him, "Abraham!"
And he said, "Here I am."

Then He said, "Take now your son, your only son, whom you love, Isaac, and go to the land of Moriah."
  `.trim();

  test.beforeEach(async ({ page }) => {
    // Navigate and login
    await page.goto('/');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 30000 });
  });

  test('should display upload style reference card and allow file upload', async ({ page }) => {
    // Phase 1: Upload and accept text
    await page.waitForSelector('textarea[id="manual-text"]', { timeout: 10000 });
    await page.fill('textarea[id="manual-text"]', sampleText);
    await page.click('button:has-text("Use This Text")');
    await expect(page.getByText(/Text ready/)).toBeVisible({ timeout: 10000 });

    // Phase 1: Generate Strategic Foundation
    await page.click('button:has-text("Next")');
    await page.waitForSelector('button:has-text("Generate Strategic Foundation Options")', { timeout: 10000 });
    await page.click('button:has-text("Generate Strategic Foundation Options")');

    // Wait for generating to complete (this can take up to 2 minutes)
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent && btn.textContent.includes('Generated in')) {
          return true;
        }
      }
      return false;
    }, { timeout: 180000 });

    // Select the first option card
    const optionCards = page.locator('section.rounded-lg').filter({ hasText: 'Option' });
    await expect(optionCards.first()).toBeVisible();
    await optionCards.first().click();

    // Wait for selection
    await page.waitForSelector('text=Strategic Foundation Selected', { timeout: 5000 });

    // Phase 2: Navigate to Narrative
    await page.click('button:has-text("Next")');
    await page.waitForSelector('button:has-text("Generate Bookend Story Options")', { timeout: 10000 });
    await page.click('button:has-text("Generate Bookend Story Options")');

    // Wait for story generation
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent && btn.textContent.includes('Generated in')) {
          return true;
        }
      }
      return false;
    }, { timeout: 180000 });

    // Select a story
    const storyCards = page.locator('section.rounded-lg').filter({ hasText: 'Option' }).filter({ hasText: 'Resonance' });
    await expect(storyCards.first()).toBeVisible();
    await storyCards.first().click();

    // Phase 3: Navigate to Lecture Generation
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Phase 3: Lecture Generation')).toBeVisible({ timeout: 10000 });

    // Test - Verify Upload Style Reference card exists
    await expect(page.locator('text=Upload Style Reference')).toBeVisible();
    await expect(page.locator('text=Upload a markdown (.md) file to guide the lecture')).toBeVisible();
    await expect(page.locator('button:has-text("Browse Files")')).toBeVisible();
    await expect(page.locator('text=Drag and drop a markdown file here')).toBeVisible();

    // Test - Upload markdown file
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await fileInput.setInputFiles(styleFilePath);

    // Verify file uploaded
    await expect(page.getByText('Ramsden Method 9_30.md')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();

    // Verify Style Analysis
    await expect(page.locator('text=Style Analysis')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Tone:')).toBeVisible();
    await expect(page.locator('text=Style:')).toBeVisible();
    await expect(page.locator('text=Structure:')).toBeVisible();
    await expect(page.locator('text=Audience:')).toBeVisible();
    await expect(page.locator('text=Length:')).toBeVisible();

    // Verify Preview
    await expect(page.locator('text=Preview')).toBeVisible();
    await expect(page.locator('text=Based on the video provided')).toBeVisible();

    // Verify Use This Style button
    await expect(page.locator('button:has-text("Use This Style")')).toBeVisible();
  });
});
