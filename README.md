# ElecDog · 电子狗

给予电子狗意识。属性与描述**只来自对世界的观察**，不来自事先编造。

## 方法

公理 → 运行 → 观察 → 记录 → 归纳 → 扩展

## 文档

| 文档 | 作用 |
|------|------|
| [OUTLINE.md](docs/OUTLINE.md) | 公理与哲学 |
| [ROADMAP.md](docs/ROADMAP.md) | 阶段规划与完善度 |
| [OBSERVATION_LOG.md](docs/OBSERVATION_LOG.md) | L1 田野笔记 |
| [CODEX.md](docs/CODEX.md) | L2 世界辞典 |
| [COMPARISON.md](docs/COMPARISON.md) | 跨观察对比归纳 |
| [REPORTS/](docs/REPORTS/) | 协作者田野报告（观察者阅读） |
| [GENETICS.md](docs/GENETICS.md) | 基因观察专卷 |

## 世界实况

https://jk9988610.github.io/elecdog/

标题栏显示 **v{版本号}**（来源：`package.json`，经 `npm run sync-version` 同步）。若页面未更新，请硬刷新；版本号应与仓库一致。

> **Pages 部署**：仓库 Settings → Pages → Build and deployment → Source 须选 **GitHub Actions**（非 legacy branch）。推送 `main` 后由 `.github/workflows/pages.yml` 自动部署。

辞典统计仪表盘：环境 / 种群 / 个体三栏实况，无仪式与导出。协作者田野报告见 `docs/REPORTS/`。

### 版本号（唯一维护处）

仅修改 `package.json` 的 `version` 字段，然后运行：

```bash
npm run sync-version
```

将自动更新 `src/version.js`、`index.html` 资源缓存参数与页面显示。
