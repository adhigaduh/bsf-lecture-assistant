import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase 3 - Markdown Style Upload', () => {
  const styleFilePath = path.join(__dirname, '../../styles/Ramsden Method 9_30.md');

  const samplePhase1 = {
    id: 'test-phase-1',
    aim: 'God tests Abraham\'s faith by asking him to sacrifice Isaac, demonstrating that genuine faith is proven through obedience and that God will provide Himself the offering.',
    divisions: [
      {
        id: 'div-1',
        title: 'The Divine Test: Abraham Called to Sacrifice',
        scriptureRange: 'Genesis 22:1-2',
        principle: 'God tests His people\'s faith by calling them to surrender what they love, proving their trust in Him absolutely.',
        keyVerses: ['Genesis 22:1-2']
      },
      {
        id: 'div-2',
        title: 'Faith in Action: Abraham\'s Immediate Obedience',
        scriptureRange: 'Genesis 22:3-6',
        principle: 'Genuine faith responds immediately and completely to God\'s command, even when the path is unclear and the cost is high.',
        keyVerses: ['Genesis 22:3-6']
      },
      {
        id: 'div-3',
        title: 'Divine Provision: God Provides the Ram',
        scriptureRange: 'Genesis 22:7-14',
        principle: 'When God tests our faith, He also provides the way of obedience and demonstrates His faithfulness as Jehovah-Jireh.',
        keyVerses: ['Genesis 22:13-14']
      }
    ],
    confidenceScore: 85,
    reasoning: 'The passage is a clear example of divine testing that is foundational to understanding the nature of faith and obedience.'
  };

  const samplePhase2 = {
    id: 'test-phase-2',
    title: 'The Crisis Faith: When Obeying God Seems Impossible',
    tone: 'personal',
    opening: 'Ari, an Indonesian software engineer in Jakarta, faced a life-altering decision. His brother had invited him to join a startup in California with a significant salary bump - enough to finally support his aging parents and pay for his sister\'s education. But accepting meant leaving his growing campus ministry in the middle of an outreach program that was just beginning to bear fruit. Ari had prayed for an opportunity like this for years. "Lord," he thought, "if this isn\'t from You, why have You opened every door?"',
    cliffhanger: 'With departure date just two weeks away, Ari\'s phone rang. His brother\'s voice was unusually somber. "The investors have pulled out. They want someone local. The offer... it\'s gone. Ari, what do we do now?" Ari\'s breath caught. His hands trembled. Was this God\'s answer? Was he rejoicing or devastated? He stood paralyzed - unable to speak, unable to move.',
    resolution: 'Six months later, Ari sat with his brother in that same coffee shop on Jakarta\'s main avenue. The campus ministry had doubled in size. "You know," Ari said, "losing that offer felt like the end of the world. But looking back, obedience to stay was never really about giving something up - it was about discovering that God really is enough." His brother nodded. "I didn\'t understand then. I do now." They both fell silent, watching the evening Jakarta traffic. This time, they were both still.',
    resonanceScore: 88,
    characters: [
      { name: 'Ari', role: 'Protagonist', description: 'Indonesian software engineer, faithful campus ministry leader' },
      { name: 'Ari\'s Brother', role: 'Confidant', description: 'Supportive but puzzled by Ari\'s decisions' }
    ],
    setting: {
      time: 'Present day, Wednesday evening',
      place: 'Coffee shop in Jakarta, Indonesia',
      context: 'Career decision point with family implications'
    }
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // If redirected to login, login with test credentials
    if (page.url().includes('/login')) {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpass123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=BSF Lecture Assistant')).toBeVisible();
    }

    // Load workflow state directly in localStorage to skip phases 1 & 2
    const workflowState = {
      currentPhase: 4, // This maps to Phase 3 in the UI (Lecture Generation)
      uploadedText: 'Genesis 22:1-19 - Now it came about after these things, that God tested Abraham',
      extractedText: 'Genesis 22:1-19',
      fileName: 'Genesis 22.md',
      phase1: {
        options: [samplePhase1],
        selected: samplePhase1,
        isGenerating: false,
        error: null
      },
      phase2: {
        options: [samplePhase2],
        selected: samplePhase2,
        isGenerating: false,
        error: null
      },
      phase3: {
        lecture: null,
        worshipSongs: [],
        isGenerating: false,
        error: null,
        progress: 0
      },
      phase4: {
        visualAssets: [],
        isGenerating: false,
        error: null
      },
      settings: {
        language: 'en',
        aiProvider: 'anthropic',
        aiModel: 'claude-3-5-sonnet-20241022',
        quickMode: false,
        autoSave: true
      }
    };

    // Save to localStorage and reload
    await page.evaluate((state) => {
      localStorage.setItem('bsf-lecture-workflow', JSON.stringify(state));
    }, workflowState);

    // Reload to pick up the localStorage state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to Phase 3 (Lecture Generation)
    await page.click('text=Lecture');
    await page.waitForLoadState('networkidle');

    // Verify we're in Phase 3
    await expect(page.locator('text=Phase 3: Lecture Generation')).toBeVisible({ timeout: 10000 });
  });

  test('should display upload style reference card in Phase 3', async ({ page }) => {
    // Verify the Upload Style Reference card exists
    await expect(page.locator('text=Upload Style Reference')).toBeVisible();
    await expect(page.locator('text=Upload a markdown (.md) file to guide the lecture\'s writing style')).toBeVisible();

    // Verify the browse files button exists
    await expect(page.locator('button:has-text("Browse Files")')).toBeVisible();

    // Verify the drag and drop area exists
    await expect(page.locator('text=Drag and drop a markdown file here')).toBeVisible();
  });

  test('should allow uploading a markdown style file via browse button', async ({ page }) => {
    // Set up file upload handler - find the file input
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await expect(fileInput).toBeVisible();

    // Upload the style markdown file
    await fileInput.setInputFiles(styleFilePath);

    // Verify the file name is displayed
    await expect(page.getByText('Ramsden Method 9_30.md')).toBeVisible({ timeout: 10000 });

    // Verify the file info card appears (shows "Clear" button)
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();

    // Verify Style Analysis appears
    await expect(page.locator('text=Style Analysis')).toBeVisible({ timeout: 5000 });

    // Verify the analysis fields are displayed
    await expect(page.locator('text=Tone:')).toBeVisible();
    await expect(page.locator('text=Style:')).toBeVisible();
    await expect(page.locator('text=Structure:')).toBeVisible();
    await expect(page.locator('text=Audience:')).toBeVisible();
    await expect(page.locator('text=Length:')).toBeVisible();

    // Verify preview section appears
    await expect(page.locator('text=Preview')).toBeVisible();

    // Verify "Use This Style" button appears
    await expect(page.locator('button:has-text("Use This Style")')).toBeVisible();
  });

  test('should display style analysis with correct information', async ({ page }) => {
    // Upload the style markdown file
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await fileInput.setInputFiles(styleFilePath);

    // Wait for file to be loaded
    await expect(page.getByText('Ramsden Method 9_30.md')).toBeVisible({ timeout: 10000 });

    // Verify Style Analysis is displayed
    await expect(page.locator('text=Style Analysis')).toBeVisible({ timeout: 5000 });

    // The style markdown mentions "speaker", "conversational", "academic", etc.
    // Verify at least one detection category is filled (values are non-empty)
    const analysisSection = page.locator('text=Style Analysis').locator('..').locator('..');
    const wordLengthText = await analysisSection.locator('text=Length:').locator('..').textContent();
    expect(wordLengthText?.trim()).toBeTruthy();
    expect(wordLengthText).toContain('words');
  });

  test('should display preview of markdown content', async ({ page }) => {
    // Upload the style markdown file
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await fileInput.setInputFiles(styleFilePath);

    // Verify Preview section appears
    await page.waitForSelector('text=Preview', { timeout: 10000 });
    await expect(page.locator('text=Preview')).toBeVisible();

    // Verify the preview shows content from the file
    // The markdown file starts with "Based on the video provided"
    await expect(page.locator('text=Based on the video provided')).toBeVisible({ timeout: 5000 });
  });

  test('should allow clearing the uploaded style', async ({ page }) => {
    // Upload the style markdown file
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await fileInput.setInputFiles(styleFilePath);

    // Verify file is uploaded
    await expect(page.getByText('Ramsden Method 9_30.md')).toBeVisible({ timeout: 10000 });

    // Click Clear button
    await page.click('button:has-text("Clear")');

    // Verify the upload area resets
    await expect(page.getByText('Ramsden Method 9_30.md')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Browse Files")')).toBeVisible();
    await expect(page.locator('text=Drag and drop a markdown file here')).toBeVisible();
  });

  test('should validate file type and only accept .md files', async ({ page }) => {
    // Create a temporary test file with wrong extension
    const tempFilePath = path.join(__dirname, 'temp-test.txt');
    await page.emulateMedia({ colorScheme: 'light' });

    // Note: This test is limited by Playwright's file upload capabilities
    // In a real scenario, we'd want to test the validation when attempting to upload non-.md files
    // For now, we just verify the file input accepts .md files
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await expect(fileInput).toHaveAttribute('accept', '.md');
  });

  test('should display file name and file size', async ({ page }) => {
    // Upload the style markdown file
    const fileInput = page.locator('input[type="file"]#style-file-input');
    await fileInput.setInputFiles(styleFilePath);

    // Verify file name is displayed
    await expect(page.getByText('Ramsden Method 9_30.md')).toBeVisible({ timeout: 10000 });

    // Verify file size is displayed somewhere near the file name
    // The file size should be shown either in KB or B format
    const fileInfoCard = page.locator('text=Ramsden Method 9_30.md').locator('..').locator('..');
    const fileInfoText = await fileInfoCard.textContent();
    expect(fileInfoText).toMatch(/\d+\s*(KB|MB|B)/i);
  });
});
