#!/usr/bin/env node
/** 为 Pages 静态资源加版本戳，避免浏览器长期缓存旧 ES module */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const siteDir = process.argv[2] || '_site';
const version = process.env.GITHUB_RUN_NUMBER || process.env.SITE_CACHE_VERSION || 'dev';

function stampJsImports(text) {
  return text.replace(
    /(from\s+['"])(\.\.?\/[^'"]+\.js)(\?v=[^'"]+)?(['"])/g,
    `$1$2?v=${version}$4`
  );
}

function stampHtml(text) {
  return text
    .replace(/(href=")(style\.css)(\?v=[^"]+)?(")/g, `$1$2?v=${version}$4`)
    .replace(/(src=")(src\/[^"]+\.js)(\?v=[^"]+)?(")/g, `$1$2?v=${version}$4`);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (extname(path) !== '.js') continue;
    const raw = readFileSync(path, 'utf8');
    const next = stampJsImports(raw);
    if (next !== raw) writeFileSync(path, next);
  }
}

const indexPath = join(siteDir, 'index.html');
writeFileSync(indexPath, stampHtml(readFileSync(indexPath, 'utf8')));
walk(join(siteDir, 'src'));

console.log(`已为 _site 打上缓存版本 v=${version}`);
