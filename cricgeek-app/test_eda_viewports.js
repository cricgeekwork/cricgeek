const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'mobile_320', width: 320, height: 568 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'desktop_1440', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/matches/mock-2/post-match', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    const title = await page.title();
    console.log(`Viewport ${vp.name}: page title = "${title}"`);
    await context.close();
  }
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
