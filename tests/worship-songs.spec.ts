import { test, expect } from '@playwright/test';

test.describe('Worship Song Suggestions', () => {
  test('should generate worship songs via Phase 3 API', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/generate/phase3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Genesis 22:1-19 - Now it came about after these things, that God tested Abraham',
          context: {
            phase1Selection: {
              aim: 'God tests Abraham faith',
              divisions: [{ title: 'The Test', scriptureRange: 'Genesis 22:1-2', principle: 'God tests faith' }]
            },
            phase2Selection: {
              title: 'A Story',
              opening: 'A man faced a test',
              cliffhanger: 'He had to choose',
              resolution: 'He chose faith'
            }
          }
        })
      });
      return await response.json();
    });
    
    expect(result.success).toBe(true);
    expect(result.data.worshipSongs).toBeDefined();
    expect(result.data.worshipSongs.length).toBeGreaterThan(0);
    
    const firstSong = result.data.worshipSongs[0];
    expect(firstSong).toHaveProperty('title');
    expect(firstSong).toHaveProperty('artist');
    expect(firstSong).toHaveProperty('category');
    expect(firstSong).toHaveProperty('thematicConnection');
    expect(firstSong).toHaveProperty('placement');
    
    console.log(`Generated ${result.data.worshipSongs.length} worship songs:`);
    result.data.worshipSongs.forEach((song: any) => {
      console.log(`- ${song.title} (${song.category}) - ${song.placement}`);
    });
  });
});
