# Phase 87 · GAP-ENV `[SCL]` 季相四相

> **一条主因果**：慢周期 `T_year=960` tick 四相调制 floor/boost/drain/solar；`[SCL]` 可观测，不叫四季。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `seasonalEnabled` on 时四相均被经历 | phasesSeen < 4 |
| H2 | 相变可记录 `[SCL]` / transitions ≥ 2 | 无相变 |
| H3 | 冷相（phase 2）LOW 率高于暖相（phase 0） | 无差 |
| H4 | 季相调制与 DLC/PCP 可并存 | 互相覆盖不可观测 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 季相 | `src/world/seasonal.js` |
| 基底耦合 | `place.js` `effectiveSubstrateModifiers` × seasonal |
| 日相耦合 | `diurnal.js` solar × `solarMult` |
| 剧变间隔 | phase 3 `pulseMult` 延长 |
| 田野 | `npm run field:phase87` |

### 四相参数（数字）

| phase | floor | boost | drain | solar |
|-------|-------|-------|-------|-------|
| 0 | ×1.14 | ×1.12 | ×0.90 | ×1.10 |
| 1 | ×1.00 | ×1.00 | ×1.00 | ×1.00 |
| 2 | ×0.86 | ×0.82 | ×1.16 | ×0.78 |
| 3 | ×0.96 | ×0.94 | ×1.04 | ×0.92 |

### 处理组

| ID | 说明 |
|----|------|
| `scl_off_ref` | 无季相（含 DLC+PCP） |
| `scl_on_ref` | 季相 T=960 |
| `scl_on_fast` | 季相 T=480 |
| `scl_on_cold` | 季相 + 耗竭偏置 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| scl_on vs off | **4/4 种子**：phasesSeen=4，transitions=8 → **support** |
| 冷相 vs 暖相 LOW | 0 LOW（富足栈）→ weak |
| **综合** | **support** — 季相记录层成立 |

报告：`docs/field-phase87-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 87（SCL 记录层）
- **下一步**：Phase 88 Synth-A/B + reservoir 耦合

---

*`[SCL]` 是 tick 上的慢相位时钟，不是公转；phase 0–3 是数字相，不是春夏秋冬。*
