# Phase 90 · GAP-ENV air 标量 + 日相耦合

> **一条主因果**：`air` 标量 ∈ [0,1] 调制 `effectiveSolar = solar × f(air)` 与 `drainMult × g(air)`；白昼高 `atmoStore` 推高 scalar（云类比）；`[AIR]` 可观测。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `airEnabled` on 时 inject 低于 off（厚大气削减注能） | 无差 |
| H2 | `effectiveSolar` 均值 on < off | 无衰减 |
| H3 | 稀薄大气（thin）LOW 率高于参考 | 无 drain 差 |
| H4 | air 与 DLC/PCP/SCL/Synth 可并存 | 互相遮蔽 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| AIR | `src/world/air.js` |
| 日相注入 | `diurnal.js` 接受 `airSolarMult` |
| drain 调制 | `place.js` `effectiveSubstrateModifiers` |
| 下游 solar | `engine.js` → PCP / Synth / SYM 用 `effectiveSolar` |
| 田野 | `npm run field:phase90` |

### 通量

- **f(air)**：`floor + (1-floor)×(1-scalar)` — 厚大气削减日注能
- **g(air)**：`1 + (1-scalar)×(boost-1)` — 稀薄大气提高耗散
- **日相耦合**：白昼 `atmoStore × solar` → scalar↑；夜间缓释

### 处理组

| ID | 说明 |
|----|------|
| `air_off_ref` | 全栈、air off |
| `air_on_ref` | air 参考（init=0.5） |
| `air_on_thick` | 厚大气（init=0.85） |
| `air_on_thin` | 稀薄大气（init=0.15，drain↑） |

（含 DLC + PCP + SCL + reservoir + Synth）

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| air_on vs off | **4/4 weak**；injectΔ≈4.93，effSolarΔ≈−0.23，meanAir≈0.43 |
| **综合** | **weak**（机制可观测，生存优势待深化） |

报告：`docs/field-phase90-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 90（`air` 记录层 + 日相耦合）
- **下一步**：Phase 91 `[ADV]` 邻格平流 + `[LTC]` 月相

---

*`air` 是大气标量场，不是地球大气化学模型。*
