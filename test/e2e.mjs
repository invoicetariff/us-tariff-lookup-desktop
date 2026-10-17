// Functional e2e: launches the Electron app via Playwright's _electron API and checks
// search, the README reference case (61091000 / 20000 USD / CN / sea / 5000 units →
// $7,394.28 & 36.97%), Chinese search, and the language toggle.
// Requires playwright available at PLAYWRIGHT_INDEX (default: global install on this machine).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const PLAYWRIGHT_INDEX =
  process.env.PLAYWRIGHT_INDEX || '/Users/dragondean/.local/lib/node_modules/playwright/index.mjs';
const { _electron } = await import(PLAYWRIGHT_INDEX);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 全局 playwright 解析不到本项目 node_modules 里的 electron 二进制，显式传路径
const electronPath = createRequire(path.join(root, 'package.json'))('electron');
const results = [];
let rendererErrors = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const electronApp = await _electron.launch({ executablePath: electronPath, args: ['.'], cwd: root });
const win = await electronApp.firstWindow();
win.on('console', (msg) => {
  if (msg.type() === 'error') {
    rendererErrors += 1;
    console.log('[renderer error]', msg.text());
  }
});

try {
  // 1. boot + meta chips
  await win.waitForSelector('#chip-ruleset:not(:empty)', { timeout: 20000 });
  check('boot: meta chips', /Ruleset|规则库/.test(await win.textContent('#chip-ruleset')), await win.textContent('#chip-ruleset'));
  await win.screenshot({ path: path.join(root, 'test', 'e2e-0-empty.png') });

  // quick links grid: 8 entries pointing at the site's most-used tools
  const qlCount = await win.locator('#ql-grid a').count();
  check('quick links rendered', qlCount === 8, `${qlCount} links`);
  const firstQl = await win.getAttribute('#ql-grid a:first-child', 'href');
  check('quick link href ok', firstQl.includes('/tariff-calculator'), firstQl);

  // sample buttons must land on a real code (laptops = 84713001 in the curated set);
  // they only exist in the empty state, so exercise them before the first manual search
  await win.click('.sample[data-sample="84713001"]');
  await win.waitForSelector('li[data-hts8="84713001"].selected', { timeout: 10000 });
  check('sample button selects a code', true, '84713001');

  // 2. search by code + reference calculation (README/npm README case)
  await win.fill('#q', '61091000');
  await win.waitForSelector('li[data-hts8="61091000"]', { timeout: 10000 });
  await win.click('li[data-hts8="61091000"]');
  await win.fill('#f-value', '20000');
  await win.fill('#f-units', '5000');
  await win.selectOption('#f-origin', 'CN');
  await win.selectOption('#f-mode', 'sea');
  await win.click('#calc-btn');
  await win.waitForSelector('#calc-result:not(.hidden)', { timeout: 10000 });
  const total = (await win.textContent('#r-total')).trim();
  const rate = (await win.textContent('#r-rate')).trim();
  check('calc total = $7,394.28', total === '$7,394.28', total);
  check('calc rate = 36.97%', rate === '36.97%', rate);
  const layerRows = await win.locator('#r-layers tbody tr').count();
  check('layers rendered (incl. total row)', layerRows >= 4, `${layerRows} rows`);
  const feeRows = await win.locator('#r-fees tbody tr').count();
  check('fees rendered', feeRows >= 1, `${feeRows} rows`);
  const basisLinks = await win.locator('#r-layers .basis a').count();
  check('source links present', basisLinks >= 2, `${basisLinks} links`);
  await win.screenshot({ path: path.join(root, 'test', 'e2e-1-calc.png') });

  // 2.5 back-to-home entry: detail must never trap the user
  await win.click('#back-home');
  await win.waitForSelector('#empty:not(.hidden)', { timeout: 5000 });
  check('back-to-home returns empty state', !(await win.isHidden('#empty')));
  check('quick links present after back', (await win.locator('#ql-grid a').count()) === 8);
  await win.fill('#q', '61091000');
  await win.waitForSelector('li[data-hts8="61091000"]', { timeout: 10000 });
  await win.click('li[data-hts8="61091000"]');
  await win.waitForSelector('#detail:not(.hidden)', { timeout: 5000 });
  check('re-select code after back', !(await win.isHidden('#detail')), '61091000');
  await win.click('#back-home');
  await win.waitForSelector('#empty:not(.hidden)', { timeout: 5000 });

  // 3. Chinese keyword search
  await win.fill('#q', '保温杯');
  await win.waitForFunction(
    () => {
      const el = document.querySelector('#results li[data-hts8]');
      return el && el.getAttribute('data-hts8') !== '61091000';
    },
    { timeout: 10000 },
  );
  const zhCode = await win.getAttribute('#results li[data-hts8]', 'data-hts8');
  check('zh search hits a code', /^\d{8}$/.test(zhCode), zhCode);
  await win.click('#results li[data-hts8]');
  check('zh result selectable', !(await win.isHidden('#detail')), zhCode);

  // 5. language toggle to 中文
  await win.click('#lang-zh');
  const tagline = await win.textContent('.tagline');
  check('lang toggle zh', tagline.includes('离线'), tagline);
  const chipZh = await win.textContent('#chip-ruleset');
  check('ruleset chip localized', chipZh.includes('规则库'), chipZh);
  await win.screenshot({ path: path.join(root, 'test', 'e2e-2-zh.png') });
  await win.click('#lang-en');

  check('no renderer console errors', rendererErrors === 0, `${rendererErrors} errors`);
} finally {
  await electronApp.close();
}

const failed = results.filter((r) => !r.ok).length + rendererErrors;
console.log(failed === 0 ? 'E2E ALL GREEN' : `E2E FAILED: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
