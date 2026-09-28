const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop — capture Contact + Closing area
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Scroll to bottom to capture contact section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, 'about_bottom.png'), fullPage: false });
  console.log('Bottom screenshot saved');

  // Full page at 1920
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page2 = await ctx2.newPage();
  await page2.goto('http://localhost:3000/about', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(1000);
  await page2.screenshot({ path: path.join(__dirname, 'about_1920.png'), fullPage: true });
  console.log('1920 screenshot saved');
  await ctx2.close();

  await ctx.close();
  await browser.close();
  console.log('Done.');
})().catch(err => { console.error(err); process.exit(1); });
