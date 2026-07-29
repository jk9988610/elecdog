# Phase 89 · GAP-ORG FUS 捕获 [SYM] module packet

> **一条主因果**：FUS 重组成功 → 子代获得半自治 `symModules[]`（store/draw）；模块通量耦合 reservoir 与 r；`[SYM] module` 可观测。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `symCaptureEnabled` on 时 FUS 子代有 module 捕获 | 与 off 无差 |
| H2 | store 模块白昼 solar → reservoir；draw 模块夜间/高压 → r | 无通量 |
| H3 | SYM module 与 Synth-A/B、DLC/PCP/SCL/reservoir 可并存 | 互相遮蔽 |
| H4 | 无 Synth 时 module 仍可独立通量 | 完全依赖 Synth |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| SYM module | `src/world/sym.js` |
| FUS 捕获 | `recombination.js` → `captureSymOnFus` |
| 每 tick 通量 | `engine.js` → `tickSymModules` |
| 初始化 | `spawn.js` → `initSymModules` |
| 田野 | `npm run field:phase89` |

### 通量

- **store**：`solar` 白昼、低压 → `reservoir[e☉]`
- **draw**：夜间或 `stress` 阈值 → `reservoir` → `r`

### 记录

- **捕获**：`[SYM] module … capture`（`meta.phase: 'capture'`）
- **通量**：`[SYM] module … store/draw`（`meta.phase: 'module'`）
- 与 Phase 88 `[SYM] synth-a/b` 用 `meta.phase` 区分

### 处理组

| ID | 说明 |
|----|------|
| `sym_off_fus` | FUS on、SYM 捕获 off |
| `sym_on_fus` | FUS + SYM 捕获（全栈含 Synth） |
| `sym_on_boost` | + 激进配对 |
| `sym_on_nosynth` | SYM 捕获但 `synthEnabled: false` |

（含 DLC + PCP + SCL + reservoir + Synth）

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| SYM on vs off | **4/4 support**；captureΔ=12，fluxΔ≈118–231 |
| boost vs base | 0 差（已达 FUS 上限） |
| **综合** | **support** |

报告：`docs/field-phase89-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ORG Phase C（FUS 捕获 `[SYM]` module）
- **下一步**：Phase 91 `[ADV]` 邻格平流 + `[LTC]` 月相

---

*SYM module 是半自治通量 packet，不是线粒体/叶绿体名称。*
