import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) throw new Error('Android project not found. Run npx cap add android first.');
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android:screenOrientation="portrait"')) {
  manifest = manifest.replace(/(<activity\b[\s\S]*?android:name="\.MainActivity"[\s\S]*?)(>)/, '$1 android:screenOrientation="portrait"$2');
}
fs.writeFileSync(manifestPath, manifest);

const res = path.join(root, 'android/app/src/main/res');
const icon = path.join(root, 'public/icon.png');
for (const entry of fs.readdirSync(res, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('mipmap-')) continue;
  const dir = path.join(res, entry.name);
  if (entry.name === 'mipmap-anydpi-v26') {
    fs.rmSync(dir, { recursive: true, force: true });
    continue;
  }
  for (const file of fs.readdirSync(dir)) {
    if (/^ic_launcher(?:_round)?\.(?:png|webp|jpg|jpeg)$/i.test(file)) fs.rmSync(path.join(dir, file));
  }
  fs.copyFileSync(icon, path.join(dir, 'ic_launcher.png'));
  fs.copyFileSync(icon, path.join(dir, 'ic_launcher_round.png'));
}
console.log('Android branding and portrait orientation applied.');
