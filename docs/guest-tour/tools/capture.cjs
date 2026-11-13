// Captures every phone screen the tour uses from the running app, plus where
// each tapped control sits (screens/taps.json), so the touch indicators land
// on the real buttons.
//
// Needs: frontend dev server on :5180 with the backend on :8005 and the demo
// data described in ../README.md, and cam.y4m (a fake camera feed) next to
// this file. Writes JPEGs straight into ../screens.
//
// The viewport is an iPhone screen minus its 54pt status bar (the tour draws
// the status bar and Dynamic Island itself), at 1.5x: 585 x 1185 px.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const B = 'http://localhost:5180';
const OUT = path.join(__dirname, '..', 'screens');
const VIEW = { width: 390, height: 790 };
const taps = {};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${path.join(__dirname, 'cam.y4m')}`] });
  const mk = async () => {
    const ctx = await b.newContext({
      ...devices['iPhone 13'], viewport: VIEW, deviceScaleFactor: 1.5, permissions: ['camera'],
      storageState: { cookies: [], origins: [{ origin: B, localStorage: [{ name: 'cookie-consent', value: 'accepted' }, { name: 'naoa_guest_code', value: 'GRACE26' }] }] },
    });
    return ctx.newPage();
  };
  const shot = (p, n) => p.screenshot({ path: path.join(OUT, `${n}.jpg`), type: 'jpeg', quality: 84 });
  const tapAt = async (name, locator) => {
    const box = await locator.boundingBox();
    taps[name] = [+((box.x + box.width / 2) / VIEW.width).toFixed(4), +((box.y + box.height / 2) / VIEW.height).toFixed(4)];
  };
  const scrollTo = (p, y) => p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  const seq = async (p, name, from, to, n) => {
    for (let i = 0; i < n; i++) {
      await scrollTo(p, from + (to - from) * ease(i / (n - 1)));
      await p.waitForTimeout(140);
      await shot(p, `${name}_${String(i).padStart(2, '0')}`);
    }
  };
  const toId = (p, id, offset = 80) => p.evaluate(([id, off]) => { const el = document.getElementById(id); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'instant' }); }, [id, offset]);

  // Invitation: envelope opening, then details.
  let p = await mk();
  await p.goto(`${B}/invitation/GRACE26`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await scrollTo(p, 0); await p.waitForTimeout(900);
  const reveal = await p.evaluate(() => { const s = document.querySelector('section[aria-label="Your invitation"]'); return s.offsetHeight - window.innerHeight; });
  await seq(p, 'env', 0, reveal + 10, 40);
  await seq(p, 'det', reveal + 10, reveal + 900, 26);

  // Entry pass from the bottom bar.
  await scrollTo(p, reveal + 400); await p.waitForTimeout(900);
  await shot(p, 'pass_0');
  const passBtn = p.getByRole('button', { name: 'Pass', exact: true });
  await tapAt('pass', passBtn);
  await passBtn.click(); await p.waitForTimeout(1400);
  await shot(p, 'pass_1');
  await p.keyboard.press('Escape'); await p.waitForTimeout(600); await p.evaluate(() => document.activeElement?.blur());

  // Directions, dress code, add to home screen.
  await toId(p, 'directions'); await p.waitForTimeout(900); await shot(p, 'directions');
  await toId(p, 'dress-code'); await p.waitForTimeout(900); await shot(p, 'dress_code');
  await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => /Add to Home Screen/i.test(e.textContent)); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 330, behavior: 'instant' }); });
  await p.waitForTimeout(900); await shot(p, 'homescreen');
  await tapAt('home', p.getByRole('button', { name: /Add to Home Screen/i }));

  // Gifts (Pay Bill card -> I've sent my gift -> thank you).
  await toId(p, 'cash-gift', 40); await p.waitForTimeout(900);
  await shot(p, 'gift_0');
  const sent = p.getByRole('button', { name: "I've sent my gift" });
  await tapAt('gift_sent', sent);
  await sent.click(); await p.waitForTimeout(1000);
  await shot(p, 'gift_1');
  const k2 = p.getByRole('button', { name: 'KES 2,000' });
  await tapAt('gift_amount', k2);
  await k2.click(); await p.fill('#report-gift-code', 'TKD4ABC12X'); await p.waitForTimeout(400);
  await shot(p, 'gift_2');
  await p.getByRole('button', { name: 'Record my gift' }).click(); await p.waitForTimeout(1300);
  await shot(p, 'gift_3');
  await p.getByRole('button', { name: 'Done' }).click(); await p.waitForTimeout(600); await p.evaluate(() => document.activeElement?.blur());

  // Location zones (More > Where are you).
  await scrollTo(p, reveal + 400); await p.waitForTimeout(700);
  await p.getByRole('button', { name: 'More', exact: true }).click(); await p.waitForTimeout(700);
  await p.getByRole('button', { name: 'Where are you' }).click(); await p.waitForTimeout(2500);
  await shot(p, 'location_1');
  await p.keyboard.press('Escape'); await p.waitForTimeout(600); await p.evaluate(() => document.activeElement?.blur());

  // Snap Studio with the fake camera.
  await scrollTo(p, reveal + 400); await p.waitForTimeout(700);
  await p.getByRole('button', { name: 'Snap', exact: true }).click(); await p.waitForTimeout(3500);
  await shot(p, 'snap_1');
  await tapAt('snap', p.getByRole('button', { name: /^Take a/ }).first());

  // RSVP.
  p = await mk();
  await p.goto(`${B}/rsvp/GRACE26`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1800);
  await p.getByText(/Will you attend/).locator('visible=true').first()
    .evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 330, behavior: 'instant' }));
  await p.waitForTimeout(700);
  await shot(p, 'rsvp_a');
  const joy = p.getByText('Joyfully', { exact: false }).locator('visible=true').first();
  await tapAt('rsvp', joy);
  await joy.click(); await p.waitForTimeout(900); await shot(p, 'rsvp_b');
  await p.evaluate(() => window.scrollBy(0, 350)); await p.waitForTimeout(700); await shot(p, 'rsvp_c');

  // Programme, the story tray and a story.
  p = await mk();
  await p.goto(`${B}/programme`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  await seq(p, 'prog', 0, 1400, 20);
  const tray = p.getByText(/Captured Moments/i).first();
  await tray.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, 160)); await p.waitForTimeout(1500);
  await shot(p, 'tray');
  const bubble = p.getByRole('button', { name: /^Watch .*story/ }).first();
  if (await bubble.count()) await tapAt('story', bubble);
  await p.goto(`${B}/programme?stories=1`, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(3000);
  await p.mouse.click(350, 400); await p.waitForTimeout(2600);
  await shot(p, 'storyB_1');

  fs.writeFileSync(path.join(OUT, 'taps.json'), JSON.stringify(taps, null, 1));
  console.log(taps);
  await b.close();
})();
