# Phase 95 · GAP-11+ [DSP] 耗散定律

> **一条主因果**：`[DRW]` 摄取量按 yield 分流 → `toReg` 入账 / `lost` 耗散；`[DSP]` 可观测。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `dissipationEnabled` on 时有 lost/toReg 账本 | 与 off 无差 |
| H2 | yield 0.4 vs 0.2 → toReg 差可测 | 无 yield 差 |
| H3 | 默认 yield≈0.3 与既有行为一致 | 行为突变 |
| H4 | 不命名地球资源（仍禁止 ATP 等） | — |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| DSP | `src/world/dissip.js` |
| 代谢 | `organism.js` → `applyDissipation` |
| 田野 | `npm run field:phase95` |

### 分流

- `toReg = DRW × dspYieldFrac`
- `lost = DRW − toReg`（不回场、不入账）
- 默认 `dspYieldFrac = 0.3`（与既有硬编码一致）

### 处理组

| ID | 说明 |
|----|------|
| `dsp_off_ref` | 无 DSP 账本（legacy 0.3） |
| `dsp_on_ref` | y=0.3 |
| `dsp_on_low` | y=0.2 |
| `dsp_on_high` | y=0.4 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| low vs high yield | **4/4 support**；yieldΔ=0.20，toRegΔ≈302–304 |
| **综合** | **support** |

报告：`docs/field-phase95-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-11+ 耗散定律记录层
- **下一步**：W6 全栈耦合验收田野

---

*DSP 是通量账本，不是热力学命名表。*
