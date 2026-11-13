const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BUILD = path.join(__dirname, '..');                       // docs/guest-tour
const FONTS = path.join(__dirname, '../../../frontend/public/fonts');
const THREE_DIR = path.dirname(path.dirname(require.resolve('three')));  // npm i three@0.160.0 in this folder
const mode = process.argv[2] || 'preview';
const times = (process.argv[3] || '1,3.4,6,8.6,11.6,14,16.2,18.8,21.5,24.2,26.2,29').split(',').map(Number);
(async () => {
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8') + '</body></html>';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text().slice(0, 300)); });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.host === 'cdn.jsdelivr.net') {
      const f = path.join(THREE_DIR, u.pathname.replace('/npm/three@0.160.0', ''));
      return route.fulfill({ path: f, contentType: 'application/javascript' });
    }
    if (u.host === 'fonts.googleapis.com') {
      const css = [['Cormorant Garamond', 'cormorant-garamond.ttf'], ['Great Vibes', 'great-vibes.ttf'], ['Lato', 'lato-regular.ttf']]
        .map(([f, file]) => `@font-face{font-family:'${f}';src:url(http://local.test/fonts/${file});font-weight:100 900;font-style:normal}`).join('\n');
      return route.fulfill({ body: css, contentType: 'text/css' });
    }
    if (u.host === 'local.test') {
      if (u.pathname === '/' ) return route.fulfill({ body: html, contentType: 'text/html' });
      const rel = decodeURIComponent(u.pathname);
      const f = rel.startsWith('/fonts/') ? path.join(FONTS, rel.slice(7)) : path.join(BUILD, rel);
      if (fs.existsSync(f)) return route.fulfill({ path: f });
      return route.fulfill({ status: 404, body: '' });
    }
    return route.abort();
  });
  await p.goto('http://local.test/?render');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  await p.waitForTimeout(800);
  if (mode === 'preview') {
    fs.mkdirSync('prev', { recursive: true });
    for (const t of times) { await p.evaluate(t => window.__renderAt(t), t); await p.screenshot({ path: `prev/t${t}.jpg`, type: 'jpeg', quality: 85 }); }
  } else {
    const fps = 30, N = 30 * fps; fs.mkdirSync('frames', { recursive: true });
    const t0 = Date.now();
    const START = Number(process.env.START || 0);   // resume after an interruption
    const END = Number(process.env.END || N);         // re-render a range only
    for (let i = START; i < END; i++) {
      await p.evaluate(t => window.__renderAt(t), i / fps);
      await p.screenshot({ path: `frames/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
      if (i % 90 === 0) console.log('frame', i, ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
  }
  await b.close();
})();
