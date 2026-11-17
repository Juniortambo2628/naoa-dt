// Captures the after-the-wedding screens for the thank-you tour into
// docs/thank-you-tour/screens, plus screens/taps.json (where each tapped
// control sits). Same set-up as capture.cjs, with the site in its
// after-the-wedding mode (any date after the wedding, or Settings › After the
// Wedding › Now), gallery photos in the albums, Gallery and Guestbook switched
// on, and a personal message on the demo guest (GRACE26).
//
// The share step really uploads two photos to the local gallery.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const B = 'http://localhost:5180';
const OUT = path.join(__dirname, '..', '..', 'thank-you-tour', 'screens');
const PHOTOS = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'DnT-photoshoot');
const VIEW = { width: 390, height: 790 };
const taps = {};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const mk = async () => {
    const ctx = await b.newContext({
      ...devices['iPhone 13'], viewport: VIEW, deviceScaleFactor: 1.5,
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
  const scrollToEl = (p, locator, offset) => locator.evaluate((el, off) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'instant' }), offset);
  const seq = async (p, name, from, to, n) => {
    for (let i = 0; i < n; i++) {
      await scrollTo(p, from + (to - from) * ease(i / (n - 1)));
      await p.waitForTimeout(160);
      await shot(p, `${name}_${String(i).padStart(2, '0')}`);
    }
  };
  const blur = (p) => p.evaluate(() => document.activeElement?.blur());

  // Invitation: thank-you card, the couple's note, the photos card.
  let p = await mk();
  await p.goto(`${B}/invitation/GRACE26`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const openGallery = p.getByRole('button', { name: 'Open the gallery' });
  const toPhotos = await openGallery.evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 560);
  await seq(p, 'inv', 0, toPhotos, 30);
  await tapAt('open_gallery', openGallery);

  // Gift card (placeholder Pay Bill numbers in the local settings).
  await scrollToEl(p, p.locator('#cash-gift'), -60); await p.waitForTimeout(900);
  await shot(p, 'gift');

  // The bottom bar on the invitation.
  await scrollTo(p, toPhotos); await p.waitForTimeout(700);
  for (const [name, label] of [['bar_photos', 'Photos'], ['bar_gift', 'Gift'], ['bar_message', 'Message'], ['bar_stories', 'Stories']]) {
    await tapAt(name, p.getByRole('button', { name: label, exact: true }));
  }

  // Gallery: albums, a photo in the viewer, Save photo.
  p = await mk();
  await p.goto(`${B}/gallery`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const galEnd = await p.evaluate(() => { const f = document.querySelector('footer'); return f.getBoundingClientRect().top + window.scrollY - window.innerHeight + 40; });
  await seq(p, 'gal', 0, galEnd, 26);
  const photo = p.locator('main img').nth(3);
  await scrollToEl(p, photo, 320); await p.waitForTimeout(800);
  await shot(p, 'gal_pick');
  await tapAt('photo', photo);
  await photo.click(); await p.waitForTimeout(1500);
  await shot(p, 'viewer_1');
  const next = p.getByRole('button', { name: 'Next photo' }).last();
  if (await next.count()) { await next.click(); await p.waitForTimeout(1200); }
  await shot(p, 'viewer_2');
  await tapAt('save', p.getByText('Save photo', { exact: true }).first());
  await p.keyboard.press('Escape'); await p.waitForTimeout(600); await blur(p);

  // Add your photos from this day -> Share your photos sheet -> thank you.
  const addHere = p.getByRole('button', { name: /Add your photos from this day/i }).nth(1);
  await scrollToEl(p, addHere, 300); await p.waitForTimeout(800);
  await shot(p, 'share_0');
  await tapAt('add_here', addHere);
  await addHere.click(); await p.waitForTimeout(1000);
  await shot(p, 'share_1');
  await p.locator('input[type="file"][multiple]').setInputFiles([path.join(PHOTOS, '5-bnw.jpeg'), path.join(PHOTOS, '6.jpeg')]);
  await p.waitForTimeout(1500);
  const nameInput = p.getByPlaceholder(/So the couple know/i);
  if (await nameInput.count()) await nameInput.fill('Grace Muthoni');
  await p.waitForTimeout(300);
  await shot(p, 'share_2');
  const send = p.getByRole('button', { name: /^Share (2 photos|photo)/ });
  await tapAt('share_send', send);
  await send.click(); await p.waitForTimeout(4000);
  await shot(p, 'share_3');

  // Stories.
  p = await mk();
  await p.goto(`${B}/programme`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const tray = p.getByText(/Captured Moments/i).first();
  await scrollToEl(p, tray, 120); await p.waitForTimeout(1500);
  await shot(p, 'tray');
  await tapAt('story', p.getByRole('button', { name: /^Watch .*story/ }).first());
  await p.getByRole('button', { name: /^Watch .*story/ }).first().click(); await p.waitForTimeout(2500);
  await shot(p, 'story');

  // Public pages allow 30 API requests a minute: let the limit reset first.
  await new Promise((r) => setTimeout(r, 65000));

  // Guestbook: write a message, then the messages.
  p = await mk();
  await p.goto(`${B}/guestbook`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const nameField = p.getByPlaceholder(/Enter your name/i);
  await scrollToEl(p, nameField, 260); await p.waitForTimeout(700);
  await shot(p, 'gb_0');
  await nameField.fill('Grace Muthoni');
  await p.getByPlaceholder(/Share your wishes/i).fill('Congratulations, Dinah and Tze Ren! Thank you for a beautiful, joyful day.');
  await p.waitForTimeout(400); await blur(p);
  await shot(p, 'gb_1');
  const gbTop = await p.evaluate(() => window.scrollY);
  const msgs = await p.getByText(/Messages from Loved Ones/i).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 120);
  await seq(p, 'gbs', gbTop, msgs, 14);

  // Home page: the photo slideshow hero.
  p = await mk();
  await p.goto(`${B}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  for (let i = 0; i < 3; i++) { await shot(p, `home_${i}`); await p.waitForTimeout(5200); }

  fs.writeFileSync(path.join(OUT, 'taps.json'), JSON.stringify(taps, null, 1));
  console.log(taps);
  await b.close();
})();
