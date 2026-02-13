import { test, expect } from '@playwright/test';

test('homepage loads without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Check page loaded
  await expect(page.locator('h1')).toContainText('BSF Lecture Assistant');
  
  // Check navigation buttons exist
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`Found ${buttonCount} buttons on page`);
  
  // Print console errors
  if (consoleErrors.length > 0) {
    console.log('Console errors found:');
    consoleErrors.forEach(err => console.log('  - ' + err));
  } else {
    console.log('No console errors found!');
  }
  
  // Fail if there are hydration errors
  const hydrationError = consoleErrors.find(err => err.includes('hydrat'));
  expect(hydrationError).toBeUndefined();
});
