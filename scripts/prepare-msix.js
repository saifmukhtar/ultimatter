const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const pkgPath = path.join(ROOT_DIR, 'package.json');
const manifestSrc = path.join(ROOT_DIR, 'packaging', 'windows', 'AppxManifest.xml');
const stageDir = path.join(ROOT_DIR, 'msix_stage');
const manifestDest = path.join(stageDir, 'AppxManifest.xml');
const assetsSrc = path.join(ROOT_DIR, 'packaging', 'windows', 'Assets');
const assetsDest = path.join(stageDir, 'Assets');

// Ensure staging directory exists
fs.mkdirSync(stageDir, { recursive: true });
fs.mkdirSync(assetsDest, { recursive: true });

// Read package.json version
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const msixVersion = `${pkg.version}.0`;
console.log(`📦 Preparing MSIX manifest for version ${msixVersion}...`);

// Read template manifest
let xml = fs.readFileSync(manifestSrc, 'utf8');

// Update only the Identity tag version attribute
xml = xml.replace(/(<Identity[\s\S]*?Version=")[^"]+(")/, `$1${msixVersion}$2`);

// Write manifest with strict UTF-8 (no BOM)
fs.writeFileSync(manifestDest, xml, { encoding: 'utf8' });

// Copy visual assets
if (fs.existsSync(assetsSrc)) {
  const files = fs.readdirSync(assetsSrc);
  for (const file of files) {
    fs.copyFileSync(path.join(assetsSrc, file), path.join(assetsDest, file));
  }
}

console.log('✅ MSIX stage and manifest prepared successfully.');
