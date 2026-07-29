#!/usr/bin/env node
/** 将观察台静态资源复制到 Capacitor webDir（www/），并注入 Capacitor import map */

import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

const CAP_PACKAGES = [
  '@capacitor/core',
  '@capacitor/app',
  '@capgo/capacitor-updater',
];

const IMPORT_MAP = {
  imports: {
    '@capacitor/core': './node_modules/@capacitor/core/dist/index.js',
    '@capacitor/app': './node_modules/@capacitor/app/dist/esm/index.js',
    '@capgo/capacitor-updater': './node_modules/@capgo/capacitor-updater/dist/esm/index.js',
  },
};

if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

cpSync(join(root, 'index.html'), join(www, 'index.html'));
cpSync(join(root, 'style.css'), join(www, 'style.css'));
cpSync(join(root, 'src'), join(www, 'src'), { recursive: true });

const hasCapPackages = CAP_PACKAGES.every((pkg) => existsSync(join(root, 'node_modules', pkg)));

if (hasCapPackages) {
  for (const pkg of CAP_PACKAGES) {
    const from = join(root, 'node_modules', pkg);
    const to = join(www, 'node_modules', pkg);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  }

  const importMapTag = `<script type="importmap">\n${JSON.stringify(IMPORT_MAP, null, 2)}\n    </script>`;
  let html = readFileSync(join(www, 'index.html'), 'utf8');
  html = html.replace(
    '    <script type="module" src="src/main.js"></script>',
    `    ${importMapTag}\n    <script type="module" src="src/main.js"></script>`
  );
  writeFileSync(join(www, 'index.html'), html);
  console.log('www/ 已就绪（index.html + style.css + src/ + Capacitor 依赖）');
} else {
  console.warn('跳过 Capacitor 依赖（无 node_modules，CI/Pages 可继续；APK 请先 npm install）');
  console.log('www/ 已就绪（index.html + style.css + src/）');
}
