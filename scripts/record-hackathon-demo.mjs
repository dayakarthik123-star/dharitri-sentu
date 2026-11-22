import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Output directory for hackathon submission videos
const outputDir = path.resolve('public/hackathon-videos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to inject a sleek cinematic Judge HUD overlay into the page
async function showJudgeOverlay(page, stepNumber, tag, title, description, durationMs = 3500) {
  await page.evaluate(({ stepNumber, tag, title, description }) => {
    let overlay = document.getElementById('hackathon-judge-hud');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'hackathon-judge-hud';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '32px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.zIndex = '999999';
      overlay.style.width = '780px';
      overlay.style.maxWidth = '90vw';
      overlay.style.backgroundColor = 'rgba(13, 38, 28, 0.94)';
      overlay.style.backdropFilter = 'blur(16px)';
      overlay.style.border = '1px solid #B5E4A3';
      overlay.style.borderRadius = '16px';
      overlay.style.padding = '18px 24px';
      overlay.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 20px rgba(181, 228, 163, 0.2)';
      overlay.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      overlay.style.color = '#FFFFFF';
      overlay.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      overlay.style.pointerEvents = 'none';
      document.body.appendChild(overlay);
    }

    overlay.style.opacity = '1';
    overlay.style.transform = 'translateX(-50%) translateY(0)';
    overlay.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #B5E4A3; background: rgba(181, 228, 163, 0.15); padding: 4px 10px; border-radius: 9999px;">
          ✦ SCENE ${stepNumber} / 5 • ${tag}
        </span>
        <span style="font-size: 11px; font-weight: 600; color: #94A3B8;">Dharitri Sentu Demo</span>
      </div>
      <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; line-height: 1.25; margin-bottom: 6px;">
        ${title}
      </div>
      <div style="font-size: 13.5px; font-weight: 400; color: #E2E8F0; line-height: 1.45;">
        ${description}
      </div>
    `;
  }, { stepNumber, tag, title, description });

  await page.waitForTimeout(durationMs);
}

async function runHackathonDirector() {
  console.log('🎬 Starting Dharitri Sentu Hackathon Video Shoot...');
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });
  } catch (e) {
    try {
      browser = await chromium.launch({
        channel: 'chrome',
        headless: true
      });
    } catch (e2) {
      browser = await chromium.launch({
        headless: true
      });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    // SCENE 1: THE HOOK & CADASTRAL MAP
    console.log('📍 Scene 1: Discovery & Cadastral Satellite Engine');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    
    // Check if Assam intro is showing, click Enter
    const enterBtn = page.locator('text=Enter Dharitri Sentu');
    if (await enterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showJudgeOverlay(
        page, 1, 'THE PROBLEM & SOLUTION',
        'Dharitri Sentu: India\'s First Cadastral Evidence Engine',
        'Bridging the critical trust gap in land transactions with sub-meter cadastral satellite maps and statutory digital due diligence.'
      );
      await enterBtn.click();
      await page.waitForTimeout(1000);
    }

    // Scroll to interactive map
    await page.evaluate(() => window.scrollBy({ top: 650, behavior: 'smooth' }));
    await showJudgeOverlay(
      page, 1, 'SATELLITE GROUND TRUTH',
      'Dual-Layer Cadastral & Raw Satellite Imagery',
      'Buyers toggle between raw live Copernicus Earth observation and surveyor boundary vectors to spot encroachments before paying an advance.'
    );

    // SCENE 2: BUYER LANDLOCKER & DIGILOCKER e-KYC
    console.log('📍 Scene 2: Buyer LandLocker Document Vault');
    await page.goto('http://127.0.0.1:5173/landlocker', { waitUntil: 'networkidle' });
    await showJudgeOverlay(
      page, 2, 'BUYER IDENTITY & VAULT',
      'Zero-Paperwork DigiLocker e-KYC & Jamabandi RoR',
      'Instant paperless identity verification via MeriPehchaan. Access certified Jamabandi extracts directly from the Revenue Circle Officer.'
    );

    // SCENE 3: SELLER ACTION CENTER & 0.15 BIGHA DISCREPANCY
    console.log('📍 Scene 3: Seller Verification & Area Discrepancy Resolution');
    await page.goto('http://127.0.0.1:5173/seller/verification', { waitUntil: 'networkidle' });
    await showJudgeOverlay(
      page, 3, 'DISCREPANCY AI RESOLUTION',
      'Autonomous Land Area Discrepancy Detection',
      'Catches 0.15 Bigha mismatch between listing (2.50 Bigha) and Jamabandi (2.35 Bigha) with 1-click auto-correction to eliminate boundary disputes.'
    );

    // SCENE 4: BUYER INQUIRIES & SITE VISITS
    console.log('📍 Scene 4: Transparent Buyer-Seller Communication');
    await page.goto('http://127.0.0.1:5173/seller/inquiries', { waitUntil: 'networkidle' });
    await showJudgeOverlay(
      page, 4, 'DIRECT STAKEHOLDER MESSAGING',
      'Verified Direct Buyer Inquiries & Physical Inspection Scheduling',
      'Enables structured clarification requests and on-site physical inspection visits with end-to-end audit trails.'
    );

    // SCENE 5: HIGH-SECURITY OFFICIAL VERIFIER WORKBENCH
    console.log('📍 Scene 5: Official Revenue Officer Workbench');
    await page.goto('http://127.0.0.1:5173/official/inspector/lst-1', { waitUntil: 'networkidle' });
    await showJudgeOverlay(
      page, 5, 'STATUTORY GOVERNMENT SIGN-OFF',
      'Authorized Revenue Officer Split-Screen Workbench',
      'Jurisdiction-locked 2-column inspector for Circle Officers: verifies 30-Year NEC, Chapter X Tribal Belts, and issues digital certificates with 2FA OTP.'
    );

  } catch (err) {
    console.error('Error during video recording:', err);
  } finally {
    // Close context to flush video to disk
    await context.close();
    await browser.close();
  }

  // Find the generated video file
  const videoFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm') || f.endsWith('.mp4'));
  const latestVideo = videoFiles[videoFiles.length - 1];
  console.log(`\n🎉 HACKATHON VIDEO READY: public/hackathon-videos/${latestVideo}`);
}

runHackathonDirector();
