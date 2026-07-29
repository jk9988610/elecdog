# Phase 59 · 观察台 CODEX UI + EHU×谱系代次

> **观察台辞典**：内嵌 26 条 CODEX，可搜索与展开；  
> **统计田野**：谱系代次 × EHU 阶段 / `[EHU-LIN]` 交叉验证。

---

## 一、观察台辞典 UI

| 功能 | 说明 |
|------|------|
| 入口 | 工具栏「辞典」按钮 |
| 数据 | `src/ui/codex-data.js`（与 `docs/CODEX.md` 同步） |
| 交互 | 搜索词条/OBS · 点击展开定义/依据/可证伪 |
| 离线 | 不依赖 Supabase 或 docs 路径，Pages/APK 均可读 |

---

## 二、田野（960 tick × 4 种子 × 12 体）

| 处理组 | 说明 |
|--------|------|
| `ehu_gen_base` | 六层反馈（无谱系回响） |
| `ehu_gen_lin` | 六层 + `[EHU-LIN]` |
| `ehu_gen_full` | 六层 + 绑定 + 回响 |

运行：`npm run field:phase59`

---

## 三、假说

| 假说 | 内容 |
|------|------|
| H1 | 启用回响后 LIN 事件显著增多 |
| H2 | 回响子代分布于多个代次 |
| H3 | 谱系个体 H3 数 ≥ 基线 |
| H4 | 全套深化组 maxGen ≥ 3 |
| H5 | 绑定+回响并存且 LIN 保持 |
| H6 | 多代个体中 H3 可观察 |

---

## 四、方法论说明

- 辞典 UI **不改变世界规则**，仅呈现已确立 L2 条目
- 电子人相关 4 条词条标 `[EHU]` 标签
- 田野交叉分析 `generation` 与 `ehuStage` / `ehuLineageEcho`

---

*Phase 59 · OUTLINE Phase 4+ 观察台里程碑*
