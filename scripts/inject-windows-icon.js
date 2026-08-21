const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const exePath = path.join(ROOT_DIR, 'bin', 'ultimatter-windows-x64.exe');
const iconPath = path.join(ROOT_DIR, 'assets', 'icon.ico');

if (!fs.existsSync(exePath) || !fs.existsSync(iconPath)) {
  console.error('❌ Cannot inject icon: missing .exe or icon.ico');
  process.exit(1);
}

try {
  let ResEdit;
  try {
    ResEdit = require('resedit');
  } catch (e) {
    const { execSync } = require('child_process');
    execSync('npm install --no-save resedit', { stdio: 'ignore' });
    ResEdit = require('resedit');
  }

  const exeData = fs.readFileSync(exePath);
  const exe = ResEdit.NtExecutable.from(exeData);
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1,
    1033,
    iconFile.icons.map(item => item.data)
  );

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log('✅ Injected official Ultimatter icon into bin/ultimatter-windows-x64.exe');
} catch (err) {
  console.error('⚠️ Failed to inject Windows icon:', err.message);
}
