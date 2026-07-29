# Phase 85 · GAP-ENV band E/M/P + `[DLC]` 日相

> **一条主因果**：区带静态梯度 + tick 日相调制注能通道 e2；`[DLC]` 可观测，不叫太阳/昼夜。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `birthPlace` 解析为 `{band}-{patch}`（E/M/P） | 仍为单点 `01` |
| H2 | `diurnalEnabled` on 时 `meanSolar`/`meanInject` > 0 | 与 off 无差 |
| H3 | 夜间 LOW 率高于日间（日相 on） | 无昼夜 tick 分层 |
| H4 | 同栈下 band E 比 P 存活/注能更优 | E/P 无参数差 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 区带 | `src/world/place.js` |
| 日相 | `src/world/diurnal.js` |
| 基底耦合 | `substrate.js` `effectiveSubstrateModifiers` |
| 引擎 | `engine.js`：tick++ → DLC 注能 → advanceSubstrate |
| 诞生偏置 | `spawn.js` `applyPlaceBirthBias` |
| 田野 | `npm run field:phase85` |

### 参数

- `T_day = 240` tick
- `solar = max(0, sin(2π·tick/T_day))`
- 注能通道：**e2**（e☉）
- 区带梯度：E 高 floor/低 drain；P 低 floor/高 drain

### 处理组

| ID | 说明 |
|----|------|
| `dlc_off_M` | 无日相 · 中带 M-00 |
| `dlc_on_M` | 日相 · 中带 |
| `dlc_on_E` | 日相 · 赤道带 E-00 |
| `dlc_on_P` | 日相 · 极带 P-00 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 指标 | dlc_on_M（示例 seed0） | dlc_off_M |
|------|------------------------|-----------|
| meanSolar | 0.318 | — |
| meanInject | 0.0094 | — |
| day/night ticks | 904 / 1016 | 0 / 0 |
| birthPlace | `M-00` | `M-00` |

| 区带 inject（seed0） | E | M | P |
|---------------------|---|---|---|
| meanInject | 0.0079 | 0.0094 | 0.0058 |

- **DLC 可观测 ✓**（日相 tick 分层 + 注能通量）
- 昼夜 LOW 差 / E vs P 存活差：**未显著**（富足 W2 栈下 0 END）
- 综合：**weak** — 记录层成立；胁迫对照待更长 tick 或耦合 reservoir（Phase 86+）

报告：`docs/field-phase85-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 1–2（band + DLC 记录层）
- **下一步**：Phase 86 terrain L/O + `[PCP]` 简化水循环

---

*`[DLC]` 是 tick 上的相位时钟，不是地球自转；band 是观察界面，不是纬度。*
