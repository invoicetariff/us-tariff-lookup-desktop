// Renders the site's app/src/app/icon.svg natively at every required size (vector
// rasterization per size stays crisp at 16px, unlike downscaling a 1024 bitmap),
// with transparent corners (omitBackground). Feeds iconset -> icns, build/icon.png,
// src/renderer/icon.png; scripts/make-ico.mjs separately packs the Windows .ico.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const PLAYWRIGHT_INDEX =
  process.env.PLAYWRIGHT_INDEX || '/Users/dragondean/.local/lib/node_modules/playwright/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(PLAYWRIGHT_INDEX);

const SVG = 'file:///Users/dragondean/projects/invoice-tariff-tool/app/src/app/icon.svg';
mkdirSync(path.join(root, 'build'), { recursive: true });
mkdirSync(path.join(root, 'build', 'icon.iconset'), { recursive: true });

const browser = await chromium.launch();

async function render(size, out) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.goto(SVG);
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log('rendered', path.relative(root, out));
}

await render(1024, path.join(root, 'build', 'icon-1024.png'));

const ICONSET = path.join(root, 'build', 'icon.iconset');
for (const s of [16, 32, 128, 256, 512]) await render(s, path.join(ICONSET, `icon_${s}x${s}.png`));
for (const s of [16, 32, 128, 256]) await render(s * 2, path.join(ICONSET, `icon_${s}x${s}@2x.png`));

await render(512, path.join(root, 'build', 'icon.png'));
await render(64, path.join(root, 'src', 'renderer', 'icon.png'));

await browser.close();
console.log('all icons rendered natively');
