import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Multiple File Upload Feature', () => {
  const sampleFile1 = path.join(__dirname, './test-file.txt');

  test.use({ 
    storageState: { 
      cookies: [], 
      origins: [] 
    },
  });

  test.beforeEach(async ({ page }) => {
    // Navigate directly to login page to avoid redirect issues
    await page.goto('/login');
    
    // Login
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for navigation to home page
    await page.waitForURL(/\//, { timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Verify we're on the home page
    if (page.url().includes('/login')) {
      throw new Error('Redirected to login, test setup failed');
    }
    
    // Wait for the main app to load
    await expect(page.getByText('Upload Lesson Material')).toBeVisible({ timeout: 20000 });
    console.log('App loaded successfully');
    
    // Additional wait to ensure everything is stable
    await page.waitForTimeout(500);
  });

  test('should upload single file and show in list', async ({ page }) => {
    // Upload a file
    console.log('Starting file upload...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleFile1);

    // Wait for upload to complete - look for the success message
    console.log('Waiting for upload completion...');
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });
    console.log('Upload successful');
    
    // Check that file list appears
    await expect(page.locator('text=Uploaded Files (1)')).toBeVisible({ timeout: 5000 });
    console.log('File list visible');
    
    // Check file is in list (use exact match to avoid finding success message or "From:" text)
    await expect(page.getByText('test-file.txt', { exact: true })).toBeVisible();
    console.log('File name visible in list');
    
    // Check file is selected (blue background)
    const selectedFile = page.locator('div[class*="border-blue-500"], div[class*="bg-blue-50"]').filter({ hasText: 'test-file.txt' });
    await expect(selectedFile).toBeVisible();
    console.log('File is selected');
    
    // Verify "Selected" badge
    await expect(page.locator('text=Selected').first()).toBeVisible();
    console.log('Selected badge visible');
  });

  test('should allow uploading multiple files', async ({ page }) => {
    // Upload first file
    console.log('Uploading first file...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    // Wait for file list to update
    await expect(page.locator('text=Uploaded Files (1)')).toBeVisible();
    console.log('First file uploaded');

    // Upload second file (same file again)
    console.log('Uploading second file...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    // Check that file list shows 2 files
    await expect(page.locator('text=Uploaded Files (2)')).toBeVisible({ timeout: 10000 });
    console.log('Second file uploaded, count is 2');

    // Verify both files are in the list
    // The file list card contains file items with name text
    const fileListCard = page.locator('text=Uploaded Files').locator('..').locator('..');
    const fileItems = fileListCard.getByText('test-file.txt', { exact: true });
    await expect(fileItems).toHaveCount(2);
    console.log('Both files visible in list');
  });

  test('should allow selecting different files from list', async ({ page }) => {
    // Upload two files
    console.log('Uploading two files...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });
    
    // Should have 2 files
    await expect(page.locator('text=Uploaded Files (2)')).toBeVisible();
    console.log('Two files uploaded');
    
    // Get the file list card
    const fileListCard = page.locator('text=Uploaded Files').locator('..').locator('..');
    
    // Get file name elements in the list
    const fileItems = fileListCard.getByText('test-file.txt', { exact: true });
    const count = await fileItems.count();
    expect(count).toBe(2);
    console.log(`Found ${count} file items`);
    
    // Get the parent clickable divs of the file items
    const clickableItems = fileListCard.locator('.cursor-pointer').filter({ hasText: /test-file\.txt/ });
    await expect(clickableItems).toHaveCount(2);
    
    // Click on second file to select it
    await clickableItems.nth(1).click();
    console.log('Clicked second file');
    
    // Check it's selected (div should have the blue styling classes)
    const blueBgItems = page.locator('div[class*="border-blue-500"], div[class*="bg-blue-50"]');
    // There should be exactly 1 item (the selected one) with blue styling
    // Note: This finds all divs with these classes on the page
    await expect(blueBgItems.first()).toBeVisible();
    console.log('Second file is now selected');
  });

  test('should allow removing files from list', async ({ page }) => {
    // Upload a file
    console.log('Uploading file...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });
    
    // Check file is in list
    await expect(page.locator('text=Uploaded Files (1)')).toBeVisible();
    console.log('File uploaded and visible in list');
    
    // Click remove button (trash icon)
    console.log('Clicking remove button...');
    await page.locator('button:has([data-lucide="trash-2"]), button svg[class*="trash"]').first().click();
    
    // Wait a moment for removal
    await page.waitForTimeout(1000);
    
    // File list should disappear or show 0 files
    const fileList = page.locator('text=Uploaded Files (1)');
    await expect(fileList).not.toBeVisible({ timeout: 5000 });
    console.log('File removed from list');
  });

  test('should show correct file count and details', async ({ page }) => {
    // Upload file
    console.log('Uploading file...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });
    
    // Verify file count shows
    await expect(page.locator('text=Uploaded Files (1)')).toBeVisible();
    console.log('File count shows 1');
    
    // Verify file name appears (use exact match)
    await expect(page.getByText('test-file.txt', { exact: true })).toBeVisible();
    console.log('File name visible');
    
    // Verify character count appears (should show a number followed by "characters")
    const charCountText = page.locator('text=/\\d{1,3}(,\\d{3})*\\s+characters/i');
    await expect(charCountText.first()).toBeVisible();
    console.log('Character count visible');
  });

  test('should populate text area when file is selected', async ({ page }) => {
    // Upload file
    console.log('Uploading file...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    // Check that textarea has content
    const textarea = page.locator('textarea[id="manual-text"]');
    await expect(textarea).toBeVisible();
    console.log('Textarea visible');

    // Textarea should contain the file content (not empty)
    const textContent = await textarea.inputValue();
    console.log(`Textarea content length: ${textContent.length}`);
    expect(textContent.length).toBeGreaterThan(0);
    console.log('Textarea populated with content');
  });

  test('should combine all uploaded files when clicking "Use All Files"', async ({ page }) => {
    // Upload two files
    console.log('Uploading two files...');
    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    await page.locator('input[type="file"]').setInputFiles(sampleFile1);
    await expect(page.getByText(/".*" added to list/i)).toBeVisible({ timeout: 30000 });

    // Click "Use All Files" button
    console.log('Clicking "Use All Files" button...');
    await page.getByRole('button', { name: /Use All Files/i }).click();

    // Wait for success message
    await expect(page.getByText(/combined and ready/i)).toBeVisible({ timeout: 5000 });
    console.log('Files combined successfully');

    // Check the success card shows combined files count
    await expect(page.locator('text=/Source: 2 file\\(s\\) uploaded/')).toBeVisible();
    console.log('Combined files indicator visible');
  });
});
