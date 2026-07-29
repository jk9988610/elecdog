# Phase 60 · 电子人续行 [EHU-REN]

> **内核交叉**：续行 `[REN]`/`[PLG]` 与 EHU 阶段记录 `[EHU-REN]`；  
> **统计田野**：三组对照验证续行对 FISS / H3 / 谱系回响的影响。

---

## 一、内核变更

| 通道 | 触发 | 内容 |
|------|------|------|
| `[EHU-REN]` | `tryRplRenew` / `processPledgeRenewals` 成功 | 记录当时 EHU 阶段、连贯值、续行来源 |

- 对照组 `ehu_ren_off` 关闭 `ehuRenewTraceEnabled` 且无 `REN_BASE`
- 不设地球式「端粒/再生」语义

---

## 二、田野（960 tick × 4 种子 × 12 体）

| 处理组 | 说明 |
|--------|------|
| `ehu_ren_off` | EHU 深化（无续行） |
| `ehu_ren_only` | EHU 深化 + `[REN]` |
| `ehu_ren_plg` | EHU 深化 + `[REN]` + `[PLG]` |

运行：`npm run field:phase60`

---

## 三、假说

| 假说 | 内容 |
|------|------|
| H1 | REN 组 FISS ≥ 对照 |
| H2 | 启用续行后 `[EHU-REN]` 可观察 |
| H3 | REN 组谱系 H3 个体 ≥ 对照 |
| H4 | PLG 增加汇合续行事件 |
| H5 | PLG 组种群/分裂不劣于 REN-only |
| H6 | `[EHU-LIN]` 与 `[EHU-REN]` 可并存 |

---

## 四、方法论说明

- `[EHU-REN]` 为观察迹，不脚本化「正确续行行为」
- 续行机制沿用 Phase 39 `[REN]`/`[PLG]`，仅增加 EHU 交叉记录
- 辞典云同步留待 Phase 61

---

*Phase 60 · OUTLINE Phase 4+ 电子人续行里程碑*
