# Phase 88 · GAP-ORG Synth-A/B + reservoir 耦合

> **一条主因果**：日相 solar × e☉ → reservoir（Synth-A）；夜间/高压 reservoir → r（Synth-B）；`[SYM]` 可观测。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `synthEnabled` on 时 synthAIn > 0 | 与 off 无差 |
| H2 | 夜间/高压 synthBOut > 0 | 无 synth-b 动用 |
| H3 | Synth 与 DLC/PCP/SCL/reservoir 可并存 | 互相遮蔽 |
| H4 | 剧变情境 synth-b 高于纯储备 | 无动用差 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| Synth | `src/world/synth.js` |
| 记录 | `[SYM] synth-a` / `synth-b`（cell 通道） |
| 储备 | `reservoir.js` synth 下 skim 缩弱（×0.4） |
| 田野 | `npm run field:phase88` |

### 通量

- **Synth-A**：`solar × e☉ × amp` → `reservoir[e2]`（白昼、低压）
- **Synth-B**：`reservoir` → `r`（夜间或 stress ≥ 阈值）

### 处理组

| ID | 说明 |
|----|------|
| `synth_off_rsv` | 储备 on、Synth off |
| `synth_on_ref` | 全栈 + Synth |
| `synth_on_drain` | Synth + 耗竭偏置 |
| `synth_on_shk` | Synth + 剧变 |

（含 DLC + PCP + SCL + reservoir）

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| Synth on vs off | **4/4 support**；synthA ≈ 54–58，synthB ≈ 9300+ |
| 剧变 synth-b | 4/4 weak（动用可观测，0 END） |
| **综合** | **support** |

报告：`docs/field-phase88-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ORG Phase B（Synth-A/B 记录层）
- **下一步**：Phase 90 `air` 标量 + 日相耦合

---

*Synth-A/B 是内共生模块的原型通量，不是叶绿体/线粒体名称。*
