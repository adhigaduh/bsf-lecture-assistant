import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PDF Upload and Text Extraction', () => {
  const samplePdf = path.join(__dirname, '../pdfs/PPER_TLOT_WeeklyBundle_20_062025.pdf');

  test.use({ 
    storageState: { 
      cookies: [], 
      origins: [] 
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\//, { timeout: 30000 });
    await page.waitForTimeout(1500);
    
    if (page.url().includes('/login')) {
      throw new Error('Redirected to login, test setup failed');
    }
    
    await expect(page.getByText('Upload Lesson Material')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(500);
  });

  test('should upload PDF and extract readable text', async ({ page }) => {
    console.log('Uploading PDF file...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(samplePdf);

    // Wait for upload to complete
    console.log('Waiting for upload completion...');
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });
    console.log('Upload successful');

    // Check that file list appears
    await expect(page.locator('text=Uploaded Files (1)')).toBeVisible({ timeout: 5000 });
    console.log('File list visible');

    // Get the textarea content
    const textarea = page.locator('textarea[id="manual-text"]');
    await expect(textarea).toBeVisible();
    
    const textContent = await textarea.inputValue();
    console.log(`Extracted text length: ${textContent.length}`);
    console.log(`Extracted text preview: ${textContent.substring(0, 200)}`);

    // Verify the extracted text is NOT garbled and contains expected content
    expect(textContent.length).toBeGreaterThan(1000);
    
    // Check that key phrases from the BSF PDF are present (not garbled)
    expect(textContent).toContain('PEOPLE OF');
    expect(textContent).toContain('THE PROMISE');
    expect(textContent).toContain('ZECHARIAH');
    
    // Verify it's NOT showing the "scanned image" fallback message
    expect(textContent).not.toContain('This PDF may be a scanned image');
    
    console.log('PDF text extraction verified successfully!');
  });

  test('should not show garbled or binary text', async ({ page }) => {
    console.log('Uploading PDF file...');
    await page.locator('input[type="file"]').setInputFiles(samplePdf);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    const textarea = page.locator('textarea[id="manual-text"]');
    const textContent = await textarea.inputValue();
    
    // Verify no binary/garbled characters
    const hasHighAsciiChars = /[\x80-\xFF]{5,}/.test(textContent);
    expect(hasHighAsciiChars).toBe(false);
    
    // Verify no PDF internal syntax leaked
    expect(textContent).not.toContain('obj');
    expect(textContent).not.toContain('endobj');
    expect(textContent).not.toContain('stream');
    
    console.log('Text is clean, no garbled characters detected');
  });
});
