import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test Unicode/PC compatibility for file upload
test.describe('Unicode File Upload', () => {
  test('should handle Unicode text content in TXT files', async ({ page }) => {
    test.setTimeout(60000);
    
    // Create a test file with Unicode content
    const unicodeContent = `Matthew 5:1-12 - 印尼语

Berbahagialah orang yang miskin di hadapan Allah,
karena merekalah yang empunya Kerajaan Surga.

Berbahagialah orang yang berduka cita,
karena mereka akan dihibur.

日本語テキストもサポートされています。
한국어 텍스트도 지원됩니다.
`;

    // Write test file with UTF-8 encoding
    const testDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const testFilePath = path.join(testDir, 'unicode-test.txt');
    fs.writeFileSync(testFilePath, unicodeContent, 'utf-8');

    try {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Upload the file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for upload to complete
      await page.waitForSelector('text=characters ready', { timeout: 30000 });
      
      // Check that Unicode content is preserved
      const textarea = page.locator('textarea');
      const content = await textarea.inputValue();
      
      // Verify Unicode characters are preserved
      expect(content).toContain('印尼语');
      expect(content).toContain('Berbahagialah');
      expect(content).toContain('日本語');
      expect(content).toContain('한국어');
      
      console.log('Unicode content preserved successfully');
    } finally {
      // Cleanup
      try {
        fs.unlinkSync(testFilePath);
        fs.rmdirSync(testDir);
      } catch {}
    }
  });

  test('should handle files with Unicode filenames', async ({ page }) => {
    test.setTimeout(60000);
    
    // Create a test file with Unicode filename
    const testDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Test with various Unicode characters in filename
    const unicodeFileName = '测试-file-üñíçødé.txt';
    const testFilePath = path.join(testDir, unicodeFileName);
    fs.writeFileSync(testFilePath, 'Test content', 'utf-8');

    try {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Upload the file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for upload to complete
      await page.waitForSelector('text=characters ready', { timeout: 30000 });
      
      console.log('Unicode filename handled successfully');
    } finally {
      // Cleanup
      try {
        fs.unlinkSync(testFilePath);
        fs.rmdirSync(testDir);
      } catch {}
    }
  });
});
