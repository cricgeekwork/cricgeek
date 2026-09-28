const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop 1440
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await ctx1.newPage();
  await page1.goto('http://localhost:3000/about', { waitUntil: 'networkidle', timeout: 30000 });
  await page1.waitForTimeout(1500);
  await page1.screenshot({ path: path.join(__dirname, 'about_desktop.png'), fullPage: true });
  console.log('Desktop screenshot saved: about_desktop.png');
  await ctx1.close();

  // Mobile 390
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await ctx2.newPage();
  await page2.goto('http://localhost:3000/about', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(1500);
  await page2.screenshot({ path: path.join(__dirname, 'about_mobile.png'), fullPage: true });
  console.log('Mobile screenshot saved: about_mobile.png');
  await ctx2.close();

  await browser.close();
  console.log('Done.');
})().catch(err => { console.error(err); process.exit(1); });
