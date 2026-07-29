#!/usr/bin/env node
/**
 * 构建 OTA 网页包 + 清单（部署到 GitHub Pages /updates/）
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, readFileSync, renameSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const updatesDir = join(root, 'updates');
const appId = 'com.elecdog.observer';
const pagesBase = 'https://jk9988610.github.io/elecdog/updates';

const runNo = process.env.GITHUB_RUN_NUMBER || '0';
const version = process.env.OTA_VERSION || `1.0.${runNo}`;
const zipName = `www-${version}`;

mkdirSync(updatesDir, { recursive: true });
execSync('node scripts/prepare-www.mjs', { cwd: root, stdio: 'inherit' });

const metaRaw = execSync(
  `npx @capgo/cli bundle zip ${appId} --path www --json --bundle ${version} -n ${zipName}`,
  { cwd: root, encoding: 'utf8' }
);

const meta = JSON.parse(metaRaw);
const checksum = meta.checksum;
const builtPath = join(root, zipName);
const destZip = join(updatesDir, `${zipName}.zip`);

if (!checksum || !existsSync(builtPath)) {
  console.error('OTA 打包失败', meta);
  process.exit(1);
}

if (existsSync(destZip)) rmSync(destZip);
renameSync(builtPath, destZip);

const wwwJson = {
  version,
  url: `${pagesBase}/${zipName}.zip`,
  checksum,
};
writeFileSync(join(updatesDir, 'www.json'), JSON.stringify(wwwJson, null, 2) + '\n');

const apkPath = join(updatesDir, 'apk.json');
let apk = { versionCode: 1, apkUrl: '', message: '观察台壳层有更新，是否下载新 APK 安装？' };
if (existsSync(apkPath)) {
  try {
    apk = { ...apk, ...JSON.parse(readFileSync(apkPath, 'utf8')) };
  } catch {
    /* keep */
  }
}
writeFileSync(apkPath, JSON.stringify(apk, null, 2) + '\n');

console.log(`OTA 已生成 v${version}`);
console.log(JSON.stringify(wwwJson, null, 2));
