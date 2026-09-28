const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const sizes = [
    { w: 1920, h: 1080, name: 'v3_1920' },
    { w: 1440, h: 900,  name: 'v3_1440' },
    { w: 1366, h: 768,  name: 'v3_1366' },
    { w: 1280, h: 800,  name: 'v3_1280' },
    { w: 768,  h: 1024, name: 'v3_768'  },
    { w: 390,  h: 844,  name: 'v3_390'  },
  ];

  for (const { w, h, name } of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, `${name}.png`), fullPage: true });
    console.log(`Saved ${name}.png`);
    await ctx.close();
  }

  await browser.close();
  console.log('All done.');
})().catch(err => { console.error(err); process.exit(1); });
