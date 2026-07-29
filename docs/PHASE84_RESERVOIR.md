# Phase 84 · GAP-ORG 储备池 `[RSV]` 记录层

> **一条主因果**：与寄存器 `r` 分离的 `reservoir` 储备池；低压储存、高压动用；`[RSV] in/out` 可观测。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `reservoirEnabled` on 时个体积累储备（meanReservoirSum > 0） | on/off 无差异 |
| H2 | 剧变情境下 `[RSV] out` 通量可观测（rsvOutTotal > 0） | 全程无动用 |
| H3 | 有储备者在剧变下 END 率或存活优于无储备 | 四种子均无差异且机制未触发 |
| H4 | 机制可 on/off 对照，不脚本化变聪明 | 仅改标签无通道差 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 储备池逻辑 | `src/world/reservoir.js` |
| 引擎集成 | `src/kernel/engine.js`（DRW 后 tick） |
| 诞生初始化 | `src/birth/spawn.js` |
| 处理组 | `PHASE84_TREATMENTS` in `env-profile.js` |
| 田野 | `npm run field:phase84` |

### 通道语义

- **`[RSV] in`**：DRW 储存分支（`via drw`）或低压寄存器 skim（`via skim`）
- **`[RSV] out`**：stress ≥ 阈值或 `lowStreak` 达阈时从储备池向 `r` 释放
- 储备与 `r` 分离；田野统计模式用 `rsvInTotal`/`rsvOutTotal` 聚合（不依赖逐 tick 日志）

### 处理组

| ID | 说明 |
|----|------|
| `rsv_off_ref` | 无储备 · 基线 |
| `rsv_off_shk` | 无储备 · 剧变（pulse 50 + 耗竭偏置） |
| `rsv_on_ref` | 储备 on · 基线 |
| `rsv_on_shk` | 储备 on · 剧变 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 观测 |
|------|------|
| `rsv_on` vs `rsv_off` | on 组 meanReservoirSum ≈ 8（满池），off 组 = 0 |
| 剧变四种子 | rsvOutTotal 11.7–21.5；**RSV 可观测 ✓** |
| END / 存活 | 剧变组均 12/12 存活、0 END（高压抑制增殖，未触发谱系 END） |
| 综合 | **weak** — 记录层成立；生存优势待 Phase 85 日相 × 更长 tick 验证 |

报告：`docs/field-phase84-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ORG Phase A（记录层）
- **未交付**：Synth-A/B、FUS `[SYM]` 捕获（Phase 88–89）
- **下一步**：Phase 85 `band` + `[DLC]` 日相 — 连接「夜间动用储备」假说

---

*去掉地球名后：储备池 = 与 r 分离的内部通量缓冲；[RSV] = 可田野对账的 in/out 记录。*
