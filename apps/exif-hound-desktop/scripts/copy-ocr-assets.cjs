const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const output = path.join(appRoot, 'public', 'ocr');
const worker = require.resolve('tesseract.js/dist/worker.min.js');
const coreRoot = path.dirname(require.resolve('tesseract.js-core/package.json'));
const languageRoot = path.dirname(require.resolve('@tesseract.js-data/eng/package.json'));

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, 'core'), { recursive: true });
fs.mkdirSync(path.join(output, 'lang'), { recursive: true });
fs.copyFileSync(worker, path.join(output, 'worker.min.js'));

for (const file of fs.readdirSync(coreRoot)) {
  if (/^tesseract-core.*\.(?:js|wasm)$/.test(file)) {
    fs.copyFileSync(path.join(coreRoot, file), path.join(output, 'core', file));
  }
}

fs.copyFileSync(
  path.join(languageRoot, '4.0.0_best_int', 'eng.traineddata.gz'),
  path.join(output, 'lang', 'eng.traineddata.gz'),
);

console.log('Copied local Tesseract worker, core, and English language data.');
