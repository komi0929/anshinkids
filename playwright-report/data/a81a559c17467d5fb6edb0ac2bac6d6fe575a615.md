# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile_audit.spec.ts >> Anshin Kids Full E2E Mobile Audit >> Complete Flow: Onboarding -> Dashboard -> Talk Modal
- Location: e2e\mobile_audit.spec.ts:7:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('a[href^="/talk/"]').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e14]:
        - img [ref=e16]
        - generic [ref=e19]:
          - heading "あんしんキッズ" [level=1] [ref=e20]
          - paragraph [ref=e21]: みんなで育てる知恵袋コミュニティ
      - link "ようこそ！ 子どものアレルギーの知恵を、 みんなで共有しましょう ログインすると、アレルゲン情報に合わせた「あなた専用の知恵袋」が届き、みんなの投稿にリアクションできるようになります。 30秒で始める（無料登録）" [ref=e23] [cursor=pointer]:
        - /url: /login
        - generic [ref=e25]:
          - img [ref=e27]
          - heading "ようこそ！ 子どものアレルギーの知恵を、 みんなで共有しましょう" [level=2] [ref=e30]:
            - text: ようこそ！
            - text: 子どものアレルギーの知恵を、
            - text: みんなで共有しましょう
          - paragraph [ref=e31]: ログインすると、アレルゲン情報に合わせた「あなた専用の知恵袋」が届き、みんなの投稿にリアクションできるようになります。
          - button "30秒で始める（無料登録）" [ref=e32]
    - navigation "メインナビゲーション" [ref=e33]:
      - generic [ref=e34]:
        - link "ホーム" [ref=e35] [cursor=pointer]:
          - /url: /home
          - img [ref=e36]
          - generic [ref=e39]: ホーム
        - link "みんなの声" [ref=e40] [cursor=pointer]:
          - /url: /talk
          - img [ref=e41]
          - generic [ref=e43]: みんなの声
        - link "知恵袋" [ref=e44] [cursor=pointer]:
          - /url: /wiki
          - img [ref=e45]
          - generic [ref=e48]: 知恵袋
        - generic "AI相談（準備中）" [ref=e49]:
          - img [ref=e50]
          - generic [ref=e52]: AI相談
          - generic [ref=e53]: 準備中
        - link "ログイン" [ref=e54] [cursor=pointer]:
          - /url: /login
          - img [ref=e55]
          - generic [ref=e58]: ログイン
  - alert [ref=e59]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import * as fs from 'fs';
  3  | import * as path from 'path';
  4  | 
  5  | test.describe('Anshin Kids Full E2E Mobile Audit', () => {
  6  | 
  7  |   test('Complete Flow: Onboarding -> Dashboard -> Talk Modal', async ({ page }) => {
  8  |     // 1. Visit Site (Onboarding)
  9  |     await page.goto('/');
  10 |     
  11 |     // Wait for the app to settle
  12 |     await page.waitForLoadState('networkidle');
  13 | 
  14 |     // Screenshot the very first page of the Wizard
  15 |     await page.screenshot({ path: 'proof/01-onboarding-start.png', fullPage: true });
  16 | 
  17 |     // Step 1: Select Allergen and Click Next
  18 |     await page.getByRole('button', { name: "アーモンド", exact: false }).first().click({ force: true });
  19 |     
  20 |     // Crucial UX Check: Can we scroll and click Next?
  21 |     // We scroll fully down to make sure the footer isn't blocking it
  22 |     await page.evaluate(() => window.scrollBy(0, 1000));
  23 |     await page.screenshot({ path: 'proof/02-onboarding-scrolled-to-next.png' });
  24 |     
  25 |     const nextButton = page.getByRole('button', { name: "次へ" }).first();
  26 |     await expect(nextButton).toBeVisible();
  27 |     await nextButton.click({ force: true });
  28 | 
  29 |     // Step 2: Select Age
  30 |     await page.getByRole('button', { name: "6〜12歳" }).first().click({ force: true });
  31 |     await page.getByRole('button', { name: "次へ" }).first().click({ force: true });
  32 | 
  33 |     // Step 3: Select Interest and Finish
  34 |     await page.getByRole('button', { name: "安全な市販品を知りたい" }).first().click({ force: true });
  35 |     const finishButton = page.getByRole('button', { name: "あんしんキッズをはじめる" });
  36 |     await expect(finishButton).toBeVisible();
  37 |     await finishButton.click({ force: true });
  38 | 
  39 |     // Wait for redirect to happen (onboarding complete)
  40 |     await page.waitForTimeout(1500); 
  41 | 
  42 |     // 2. Dashboard Observation
  43 |     await page.waitForLoadState('domcontentloaded');
  44 |     await page.screenshot({ path: 'proof/03-dashboard-home.png', fullPage: true });
  45 | 
  46 |     // Ensure Navigation isn't wrapping poorly
  47 |     const nav = page.locator('nav.bottom-nav');
  48 |     if (await nav.count() > 0) {
  49 |       await expect(nav).toBeVisible();
  50 |       await page.screenshot({ path: 'proof/04-bottom-navigation-rendering.png' });
  51 |     }
  52 | 
  53 |     // 3. Talk Room Modal Interactivity
  54 |     const talkNav = page.locator('a[id="nav-talk"]');
  55 |     if (await talkNav.count() > 0) {
  56 |       await talkNav.click({ force: true });
  57 |       await page.waitForTimeout(1000);
  58 |       
  59 |       // Click first talk room
> 60 |       await page.locator('a[href^="/talk/"]').first().click({ force: true });
     |                                                       ^ Error: locator.click: Test timeout of 60000ms exceeded.
  61 |       await page.waitForTimeout(1500);
  62 | 
  63 |       // Screenshot Talk Room
  64 |       await page.screenshot({ path: 'proof/05-talk-room-entered.png', fullPage: true });
  65 | 
  66 |       // Click to pop up Promise Modal
  67 |       const promptChip = page.locator('button:has-text("こんなこと聞いていいのかな")').first();
  68 |       if (await promptChip.count() > 0) {
  69 |         await promptChip.click({ force: true });
  70 |         
  71 |         await page.waitForTimeout(500);
  72 |         // Modal appears
  73 |         await page.screenshot({ path: 'proof/06-promise-modal-opened.png', fullPage: true });
  74 |         
  75 |         // Scroll the modal to bottom
  76 |         const modalContainer = page.locator('.overflow-y-auto');
  77 |         if (await modalContainer.count() > 0) {
  78 |           await modalContainer.evaluate(e => e.scrollTop = e.scrollHeight);
  79 |         }
  80 |         await page.waitForTimeout(500);
  81 |         
  82 |         await page.screenshot({ path: 'proof/07-promise-modal-scrolled.png', fullPage: true });
  83 | 
  84 |         const agreeBtn = page.locator('button[id="accept-guidelines"]');
  85 |         await expect(agreeBtn).toBeVisible();
  86 |         await agreeBtn.click({ force: true });
  87 | 
  88 |         await page.waitForTimeout(500);
  89 |         await page.screenshot({ path: 'proof/08-promise-modal-closed.png' });
  90 |       }
  91 |     }
  92 |   });
  93 | 
  94 | });
  95 | 
```