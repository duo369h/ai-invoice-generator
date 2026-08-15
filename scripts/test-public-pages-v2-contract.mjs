import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const requireText = (source, text, label) => assert.ok(source.includes(text), `${label}: missing ${text}`);

const home = read('src/app/home/HomeV1.js');
const photographers = read('src/app/for-photographers/ForPhotographersV1.js');
const footer = read('src/app/components/SharedFooter.js');

assert.ok(existsSync(path.join(root, 'public/brand/corvioz-icon-master.svg')), 'locked master icon is installed');
assert.ok(existsSync(path.join(root, 'public/brand/corvioz-icon-small.svg')), 'locked small icon is installed');
requireText(home, 'id="how-corvioz-works"', 'HOME workflow anchor');
requireText(home, 'id="founder-trust"', 'HOME founder trust section');
assert.ok(!/View Example/i.test(home), 'HOME does not expose View Example');
requireText(footer, 'footer-trust-strip', 'shared approved footer hierarchy');
requireText(photographers, 'id="sec-workflow"', 'photographers workflow module');
requireText(photographers, 'id="sec-continuity"', 'photographers continuity module');
assert.ok(!/e-signature|calendar sync|payment processing|AI rate/i.test(photographers), 'photographers page avoids unsupported capability claims');

console.log('public-pages-v2 contract: PASS');
