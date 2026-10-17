// Packaged-app smoke test: launches a BUILT app binary (asar + asarUnpack layout)
// via Playwright's _electron and checks the engine loads from the packaged bundle.
// Usage: node test/packaged.mjs "<path to packaged Electron binary>"
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const PLAYWRIGHT_INDEX =
  process.env.PLAYWRIGHT_INDEX || '/Users/dragondean/.local/lib/node_modules/playwright/index.mjs';
const { _electron } = await import(PLAYWRIGHT_INDEX);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
if (!target) {
  console.error('usage: node test/packaged.mjs <packaged binary>');
  process.exit(2);
}

const results = [];
let rendererErrors = 0;
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const electronApp = await _electron.launch({ executablePath: target, args: [] });
const win = await electronApp.firstWindow();
win.on('console', (m) => {
  if (m.type() === 'error') {
    rendererErrors += 1;
    console.log('[renderer error]', m.text());
  }
});

try {
  await win.waitForSelector('#chip-ruleset:not(:empty)', { timeout: 20000 });
  check('packaged: engine meta loads', true, await win.textContent('#chip-ruleset'));

  await win.fill('#q', '84713001');
  await win.waitForSelector('li[data-hts8="84713001"]', { timeout: 10000 });
  await win.click('li[data-hts8="84713001"]');
  await win.click('#calc-btn');
  await win.waitForSelector('#calc-result:not(.hidden)', { timeout: 10000 });
  check('packaged: calc renders', (await win.textContent('#r-total')).trim().length > 2, await win.textContent('#r-total'));

  await win.screenshot({ path: path.join(root, 'test', 'packaged-smoke.png') });
  check('no renderer console errors', rendererErrors === 0, `${rendererErrors}`);
} finally {
  await electronApp.close();
}

const failed = results.filter((r) => !r).length + rendererErrors;
console.log(failed === 0 ? 'PACKAGED SMOKE ALL GREEN' : `PACKAGED SMOKE FAILED: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
