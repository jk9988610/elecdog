#!/usr/bin/env node
/** 将观察台静态资源复制到 Capacitor webDir（www/） */

import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

cpSync(join(root, 'index.html'), join(www, 'index.html'));
cpSync(join(root, 'style.css'), join(www, 'style.css'));
cpSync(join(root, 'src'), join(www, 'src'), { recursive: true });

console.log('www/ 已就绪（index.html + style.css + src/）');
