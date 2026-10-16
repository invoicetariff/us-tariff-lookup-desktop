// Packs build/icon.ico from build/icon.png (512, natively rendered) with all
// standard Windows sizes; electron-builder prefers build/icon.ico when present.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));
const png2icons = require('png2icons');

const input = readFileSync(path.join(root, 'build', 'icon.png'));
const ico = png2icons.createICO(input, png2icons.BICUBIC2, 0, false, true);
if (!ico) throw new Error('png2icons.createICO returned null');
writeFileSync(path.join(root, 'build', 'icon.ico'), ico);
console.log('build/icon.ico written,', ico.length, 'bytes');
