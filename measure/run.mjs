import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto('http://localhost:8753/measure/index.html', { waitUntil: 'networkidle' });
await page.waitForFunction('window.__result !== undefined', { timeout: 8000 });
const r = await page.evaluate('window.__result');
await browser.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(JSON.stringify(r, null, 2));
