import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Anshin Kids Full E2E Mobile Audit', () => {

  test('Complete Flow: Onboarding -> Dashboard -> Talk Modal', async ({ page }) => {
    // 1. Visit Site (Onboarding)
    await page.goto('/');
    
    // Wait for the app to settle
    await page.waitForLoadState('networkidle');

    // Screenshot the very first page of the Wizard
    await page.screenshot({ path: 'proof/01-onboarding-start.png', fullPage: true });

    // Step 1: Select Allergen and Click Next
    await page.getByRole('button', { name: "アーモンド", exact: false }).first().click();
    
    // Crucial UX Check: Can we scroll and click Next?
    // We scroll fully down to make sure the footer isn't blocking it
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.screenshot({ path: 'proof/02-onboarding-scrolled-to-next.png' });
    
    const nextButton = page.getByRole('button', { name: "次へ" }).first();
    await expect(nextButton).toBeVisible();
    await nextButton.click();

    // Step 2: Select Age
    await page.getByRole('button', { name: "6〜12歳" }).first().click();
    await page.getByRole('button', { name: "次へ" }).first().click();

    // Step 3: Select Interest and Finish
    await page.getByRole('button', { name: "安全な市販品を知りたい" }).first().click();
    const finishButton = page.getByRole('button', { name: "あんしんキッズをはじめる" });
    await expect(finishButton).toBeVisible();
    await finishButton.click();

    // Wait for redirect to happen (onboarding complete)
    await page.waitForTimeout(1500); 

    // 2. Dashboard Observation
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: 'proof/03-dashboard-home.png', fullPage: true });

    // Ensure Navigation isn't wrapping poorly
    const nav = page.locator('nav.bottom-nav');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
      await page.screenshot({ path: 'proof/04-bottom-navigation-rendering.png' });
    }

    // 3. Talk Room Modal Interactivity
    const talkNav = page.locator('a[id="nav-talk"]');
    if (await talkNav.count() > 0) {
      await talkNav.click();
      await page.waitForTimeout(1000);
      
      // Click first talk room
      await page.locator('a[href^="/talk/"]').first().click();
      await page.waitForTimeout(1500);

      // Screenshot Talk Room
      await page.screenshot({ path: 'proof/05-talk-room-entered.png', fullPage: true });

      // Click to pop up Promise Modal
      const promptChip = page.locator('button:has-text("こんなこと聞いていいのかな")').first();
      if (await promptChip.count() > 0) {
        await promptChip.click();
        
        await page.waitForTimeout(500);
        // Modal appears
        await page.screenshot({ path: 'proof/06-promise-modal-opened.png', fullPage: true });
        
        // Scroll the modal to bottom
        const modalContainer = page.locator('.overflow-y-auto');
        if (await modalContainer.count() > 0) {
          await modalContainer.evaluate(e => e.scrollTop = e.scrollHeight);
        }
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: 'proof/07-promise-modal-scrolled.png', fullPage: true });

        const agreeBtn = page.locator('button[id="accept-guidelines"]');
        await expect(agreeBtn).toBeVisible();
        await agreeBtn.click();

        await page.waitForTimeout(500);
        await page.screenshot({ path: 'proof/08-promise-modal-closed.png' });
      }
    }
  });

});
