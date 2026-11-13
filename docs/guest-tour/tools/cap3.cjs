const { chromium, devices } = require('playwright');
const B = 'http://localhost:5180', OUT = 'cap';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2,
    storageState: { cookies: [], origins: [{ origin: B, localStorage: [{ name: 'cookie-consent', value: 'accepted' }, { name: 'naoa_guest_code', value: 'GRACE26' }] }] } });
  const p = await ctx.newPage();
  await p.goto(`${B}/programme?stories=1`, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(3000);
  // pause story progress
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/storyB_${i}.png` }); await p.mouse.click(350, 420); await p.waitForTimeout(2600); }
  // Story tray on page (close viewer)
  await p.keyboard.press('Escape'); await p.waitForTimeout(1000);
  const tray = p.getByText(/Captured Moments|Stories/i).first();
  if (await tray.count()) { await tray.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(1200); await p.screenshot({ path: `${OUT}/tray.png` }); }
  await b.close();
})();
