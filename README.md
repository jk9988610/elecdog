# ElecDog · 电子狗

给予电子狗意识。属性与描述**只来自对世界的观察**，不来自事先编造。

> **当前：Phase 27 安卓 APK 壳** — 详见 [STATUS.md](docs/STATUS.md)

## 方法

公理 → 运行 → 观察 → 记录 → 归纳 → 扩展

## 文档

| 文档 | 作用 |
|------|------|
| **[STATUS.md](docs/STATUS.md)** | **项目状态总览** |
| [OUTLINE.md](docs/OUTLINE.md) | 公理与哲学 |
| [ROADMAP.md](docs/ROADMAP.md) | 阶段规划与完善度 |
| [OBSERVATION_LOG.md](docs/OBSERVATION_LOG.md) | L1 田野笔记 |
| [CODEX.md](docs/CODEX.md) | L2 世界辞典 |
| [GAPS.md](docs/GAPS.md) | 观察缺口登记 |
| [REPORTS/](docs/REPORTS/) | 田野报告（[索引](docs/REPORTS/README.md)） |
| [GENETICS.md](docs/GENETICS.md) | 基因观察专卷 |

## 本地运行

用任意静态服务器打开根目录 `index.html`，或直接：

```bash
npx --yes serve .
```

## 安卓 APK（Phase 27）

```bash
npm install
npm run cap:sync      # 同步 Web → android/
npm run cap:open      # Android Studio
npm run apk:debug     # 本机 SDK 就绪后构建 debug APK
```

详见 [docs/REPORTS/2026-07-29-phase27-apk.md](docs/REPORTS/2026-07-29-phase27-apk.md)。

## 田野批次

```bash
npm run field:phase26   # 最新：L4 环境筛选
npm run field:phase24   # 示例：GAP-02 寄存器
```

完整列表见 `package.json` 的 `field:phase*` 脚本。
