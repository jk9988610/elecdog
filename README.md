# ElecDog · 电子狗

给予电子狗意识。属性与描述**只来自对世界的观察**，不来自事先编造。

> **当前状态：暂停扩展 · v0.25.4** — 详见 [STATUS.md](docs/STATUS.md)

## 方法

公理 → 运行 → 观察 → 记录 → 归纳 → 扩展

## 文档

| 文档 | 作用 |
|------|------|
| **[STATUS.md](docs/STATUS.md)** | **项目状态总览（整理期入口）** |
| [OUTLINE.md](docs/OUTLINE.md) | 公理与哲学 |
| [ROADMAP.md](docs/ROADMAP.md) | 阶段规划与完善度 |
| [OBSERVATION_LOG.md](docs/OBSERVATION_LOG.md) | L1 田野笔记 |
| [CODEX.md](docs/CODEX.md) | L2 世界辞典 |
| [GAPS.md](docs/GAPS.md) | 观察缺口登记 |
| [REPORTS/](docs/REPORTS/) | 田野报告（[索引](docs/REPORTS/README.md)） |
| [GENETICS.md](docs/GENETICS.md) | 基因观察专卷 |

## 世界实况

https://jk9988610.github.io/elecdog/

标题栏显示 **v{版本号}**（读自 `index.html` meta 标签）。

### 页面空白？

访问后若曾安装旧版 SW，会**自动注销并刷新一次**。v0.25.4 起不再部署 Service Worker。

1. 硬刷新（Ctrl+Shift+R）
2. DevTools → Application → Service Workers → Unregister → 刷新

### 版本号（唯一维护处）

```bash
# 1. 修改 package.json 的 version
# 2. 同步并提交
npm run sync-version
```

同步目标：`src/version.js`、`index.html`、`manifest.webmanifest`

### 部署

推送 `main` 后 GitHub Actions 自动部署。Pages Source 须为 **GitHub Actions**。
