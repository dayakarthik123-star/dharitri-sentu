import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  const headed = process.argv.includes('--headed');
  console.log(`\n🚀 Launching Playwright E2E browser test (${headed ? 'headed' : 'headless'})...\n`);
  
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: !headed });
  } catch (err) {
    // Fallback to default chromium if installed
    browser = await chromium.launch({ headless: !headed });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    // 1. Check Homepage
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const title = await page.title();
    results.push(`✅ [Homepage]: Successfully loaded (Title: "${title}")`);

    // 2. Check LandLocker Vault
    await page.goto('http://127.0.0.1:5173/landlocker', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Check if the quarantine warning text is present
    const content = await page.content();
    const hasQuarantine = content.includes('Original file is quarantined');
    
    if (hasQuarantine) {
      results.push(`❌ [LandLocker]: Quarantine warning is still visible!`);
    } else {
      results.push(`✅ [LandLocker]: No quarantined documents found (Quarantine warning absent)`);
    }

    // Ensure screenshot directory exists
    const screenshotDir = path.resolve('public', 'test-results');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    try {
      const screenshotPath = path.join(screenshotDir, 'landlocker-latest.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });
      results.push(`📸 [Screenshot]: Saved to public/test-results/landlocker-latest.png`);
      try {
        fs.copyFileSync(screenshotPath, path.join(screenshotDir, 'landlocker-status.png'));
      } catch (_) {}
    } catch (screenshotErr) {
      results.push(`📸 [Screenshot notice]: ${screenshotErr.message}`);
    }

    console.log('--------------------------------------------------');
    results.forEach(r => console.log(r));
    console.log('--------------------------------------------------\n');
  } catch (err) {
    console.error('❌ E2E Test Error:', err.message);
  } finally {
    await browser.close();
  }
}

run();
