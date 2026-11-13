const { chromium, devices } = require('playwright');
const B = 'http://localhost:5180', OUT = 'cap';
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + __dirname + '/cam.y4m'] });
  const mk = async () => { const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2, permissions: ['camera'],
    storageState: { cookies: [], origins: [{ origin: B, localStorage: [{ name: 'cookie-consent', value: 'accepted' }, { name: 'naoa_guest_code', value: 'GRACE26' }] }] } }); return ctx.newPage(); };
  const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
  let p = await mk();
  p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 200)); });
  await p.goto(`${B}/invitation/GRACE26`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' })); await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Gift', exact: true }).click(); await p.waitForTimeout(1500); await shot(p, 'gift_1');
  await p.evaluate(() => window.scrollBy(0, 0));
  const amt = p.getByRole('button', { name: /2,000/ }).first();
  if (await amt.count()) { await amt.click(); await p.waitForTimeout(600); await shot(p, 'gift_2'); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' })); await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Snap', exact: true }).click(); await p.waitForTimeout(3500); await shot(p, 'snap_1');
  // RSVP
  p = await mk();
  await p.goto(`${B}/rsvp/GRACE26`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1800);
  await p.getByText('Will you attend', {exact:false}).first().scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, 200));
  await p.waitForTimeout(700); await shot(p, 'rsvp_a');
  await p.getByText('Joyfully', { exact: false }).first().click(); await p.waitForTimeout(900); await shot(p, 'rsvp_b');
  await p.evaluate(() => window.scrollBy(0, 350)); await p.waitForTimeout(700); await shot(p, 'rsvp_c');
  // Stories
  p = await mk();
  await p.goto(`${B}/programme?stories=1`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(3000);
  await shot(p, 'story_0');
  await p.waitForTimeout(2500); await shot(p, 'story_1');
  await p.mouse.click(350, 420); await p.waitForTimeout(1500); await shot(p, 'story_2');
  await p.mouse.click(350, 420); await p.waitForTimeout(1500); await shot(p, 'story_3');
  await b.close();
})();
