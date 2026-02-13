import { test, expect } from '@playwright/test';
import path from 'path';

test('Debug - Check Phase 3 navigation', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Login if needed
  if (page.url().includes('/login')) {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 30000 });
  }

  // Check what phase we're on
  const phaseText = await page.locator('text=Phase').first().textContent();
  console.log('Current phase text:', phaseText);

  // Take screenshot before setting state
  await page.screenshot({ path: 'test-screenshots/01-before-set-state.png' });

  // Load workflow state
  const samplePhase1 = {
    id: 'test-phase-1',
    aim: 'God tests Abraham\'s faith by asking him to sacrifice Isaac',
    divisions: [
      { id: 'div-1', title: 'The Divine Test', scriptureRange: 'Genesis 22:1-2', principle: 'Test principle', keyVerses: [] }
    ],
    confidenceScore: 85,
    reasoning: 'test'
  };

  const samplePhase2 = {
    id: 'test-phase-2',
    title: 'Test Story',
    tone: 'personal',
    opening: 'Test opening',
    cliffhanger: 'Test cliffhanger',
    resolution: 'Test resolution',
    resonanceScore: 88,
    characters: [],
    setting: { time: 'Now', place: 'Here', context: 'Test' }
  };

  const workflowState = {
    currentUser: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    currentDocumentId: null,
    documents: [],
    currentPhase: 4,
    uploadedText: 'Genesis 22:1-19',
    extractedText: 'Genesis 22:1-19',
    fileName: 'Genesis 22.md',
    phase1: { options: [samplePhase1], selected: samplePhase1, isGenerating: false, error: null },
    phase2: { options: [samplePhase2], selected: samplePhase2, isGenerating: false, error: null },
    phase3: { lecture: null, worshipSongs: [], isGenerating: false, error: null, progress: 0 },
    phase4: { visualAssets: [], isGenerating: false, error: null },
    settings: { language: 'en', aiProvider: 'anthropic', aiModel: 'claude-3-5-sonnet-20241022', quickMode: false, autoSave: true }
  };

  // Set localStorage
  await page.evaluate((state) => {
    localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state));
  }, workflowState);

  await page.screenshot({ path: 'test-screenshots/02-after-set-state.png' });

  // Reload
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'test-screenshots/03-after-reload.png' });

  // Wait for hydration
  await page.waitForTimeout(2000);

  // Check the current phase
  const currentPhaseText = await page.locator('text=Phase').first().textContent();
  console.log('Current phase after reload:', currentPhaseText);

  // Try to use the store to set the phase directly
  await page.evaluate(() => {
    // The Zustand store might be accessible globally through window or we can try to set it via the setState method
    // However, this might not work because the store is defined in the component's closure
    console.log('Attempting to set phase via store');
  });

  await page.screenshot({ path: 'test-screenshots/04-trying-set-phase.png' });

  // Check the sidebar navigation links
  const lectureBtn = page.getByText('Lecture');
  const isLectureVisible = await lectureBtn.isVisible();
  console.log('Lecture button visible:', isLectureVisible);

  // Try clicking the Lecture navigation button in the sidebar
  if (isLectureVisible) {
    await lectureBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/05-after-click-lecture.png' });

    // Check what's on the page
    const pageContent = await page.content();
    const hasPhase3 = pageContent.includes('Phase 3: Lecture Generation');
    console.log('Has Phase 3 content:', hasPhase3);

    if (!hasPhase3) {
      console.log('Page content snippet:', pageContent.substring(0, 5000));
    }
  } else {
    console.log('Lecture button not found, looking for other buttons...');
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons:', allButtons);
  }

  await page.screenshot({ path: 'test-screenshots/06-final.png' });
});
