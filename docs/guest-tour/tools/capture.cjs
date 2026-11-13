const { chromium, devices } = require('playwright');
const B = 'http://localhost:5180';
const OUT = process.argv[2] || 'cap';
const only = process.argv[3];
const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
(async () => {
  const b = await chromium.launch();
  const mk = async (extraLS = []) => {
    const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2,
      storageState: { cookies: [], origins: [{ origin: B, localStorage: [{ name: 'cookie-consent', value: 'accepted' }, ...extraLS] }] } });
    return ctx.newPage();
  };
  const settle = p => p.waitForTimeout(900);
  const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
  const seq = async (p, name, from, to, n) => {
    for (let i = 0; i < n; i++) {
      const y = from + (to - from) * ease(i / (n - 1));
      await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
      await p.waitForTimeout(140);
      await shot(p, `${name}_${String(i).padStart(2, '0')}`);
    }
  };
  const run = (k) => !only || only.split(',').includes(k);

  let p = await mk();
  await p.goto(`${B}/invitation/GRACE26`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  if (run('env')) { await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await settle(p); await seq(p, 'env', 0, 1290, 40); }
  if (run('det')) await seq(p, 'det', 1290, 2250, 26);
  if (run('pos')) {
    // Named sections for still shots
    for (const id of ['good-to-know', 'programme', 'dress-code', 'directions', 'emergency']) {
      await p.evaluate(id => { const el = document.getElementById(id); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' }); }, id);
      await settle(p); await shot(p, `sec_${id}`);
    }
    await p.evaluate(() => { const el = [...document.querySelectorAll('h3,p,button')].find(e => /home screen/i.test(e.textContent)); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 220, behavior: 'instant' }); });
    await settle(p); await shot(p, 'sec_homescreen');
    await p.evaluate(() => { const el = [...document.querySelectorAll('h3,p,span')].find(e => /send a cash gift/i.test(e.textContent)); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 160, behavior: 'instant' }); });
    await settle(p); await shot(p, 'sec_cashgift');
  }
  const bar = async (label, name) => {
    await p.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' })); await settle(p);
    await shot(p, `${name}_0`);
    await p.getByRole('button', { name: label, exact: true }).click();
    await p.waitForTimeout(1400); await shot(p, `${name}_1`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  };
  if (run('modals')) {
    await bar('Pass', 'pass');
    await bar('Gift', 'gift');
    await bar('Snap', 'snap');
    await p.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' })); await settle(p);
    await p.getByRole('button', { name: 'More', exact: true }).click(); await p.waitForTimeout(900); await shot(p, 'more_0');
    await p.getByRole('button', { name: 'Seating chart' }).click(); await p.waitForTimeout(1500); await shot(p, 'seating_1');
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    await p.getByRole('button', { name: 'More', exact: true }).click(); await p.waitForTimeout(700);
    await p.getByRole('button', { name: 'My travel details' }).click(); await p.waitForTimeout(1500); await shot(p, 'travel_1');
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    await p.getByRole('button', { name: 'More', exact: true }).click(); await p.waitForTimeout(700);
    await p.getByRole('button', { name: 'Where are you' }).click(); await p.waitForTimeout(2500); await shot(p, 'location_1');
  }
  if (run('rsvp')) {
    p = await mk();
    await p.goto(`${B}/rsvp/GRACE26`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
    await shot(p, 'rsvp_0');
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let i = 1; i <= 4; i++) { await p.evaluate(y => window.scrollTo(0, y), i * 500); await settle(p); await shot(p, `rsvp_s${i}`); }
  }
  if (run('prog')) {
    p = await mk([{ name: 'naoa_guest_code', value: 'GRACE26' }]);
    await p.goto(`${B}/programme`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    await shot(p, 'prog_0');
    await seq(p, 'progseq', 0, 1400, 20);
    await p.goto(`${B}/programme?stories=1`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    await shot(p, 'story_0');
    for (let i = 1; i <= 4; i++) { await p.mouse.click(340, 420); await p.waitForTimeout(1200); await shot(p, `story_${i}`); }
  }
  await b.close();
})();
