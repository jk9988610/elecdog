# Phase 80 · GAP-10 选择压跨种子可重复性攻坚

> **智慧栈 W2 攻坚**：在 Phase 72 基线（3/4 unanimous）上，延长 tick 至 3840 并测试多节律剧变，目标 4/4 碱基 unanimous。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | 3840 tick 比 3000 tick 提升 unanimousBases | 最佳 ≤ Phase 72（3/4） |
| H2 | 温和/节律剧变（pulse 60/80）改善碱基 1 共识 | 碱基 1 仍 2+/2- 或更差 |
| H3 | 4/4 unanimous 可达成 | 最佳处理组 < 4 |
| H4 | 延长 tick 不导致种群崩溃 | 存活归零 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 处理组 | `PHASE80_TREATMENTS` in `env-profile.js` |
| 验收 | `scripts/lib/phase80-analyze.js` |
| 田野 | `npm run field:phase80` |

### 处理组

| ID | 说明 |
|----|------|
| `w2_gap10_ref3840` | 基线 × 3840 tick |
| `w2_gap10_shk3840` | 高频剧变（pulseInterval 50） |
| `w2_gap10_mild80` | 温和剧变（pulseInterval 80） |
| `w2_gap10_rhythm60` | 节律剧变（pulse 60 + substrateBoost 0.02） |

---

## 三、田野结果（2026-07-29）

12体 × **3840** tick × 4 种子

| 处理组 | unanimousBases | meanDrift | 碱基 1 | 存活 |
|--------|----------------|-----------|--------|------|
| w2_gap10_ref3840 | 1/4 | 0.015 | 1+/3- | ✓ |
| w2_gap10_shk3840 | **2/4** | 0.020 | 2+/2- | ✓ |
| w2_gap10_mild80 | 2/4 | 0.017 | 3+/1- | ✓ |
| w2_gap10_rhythm60 | 2/4 | 0.019 | 1+/3- | ✓ |

- 最佳 **2/4** unanimous — **低于** Phase 72 的 3/4
- 碱基 **1** 仍跨种子分歧（最佳组 2+/2-）
- 碱基 **3** 四组均 unanimous 负向
- maxGen 多为 **2–3**（短代深）；SEL 计数均为 0
- 综合 **weak**；GAP-10 **仍开放**

报告：`docs/field-phase80-report.json`

---

## 四、与 GAP-10 / Phase 72 对照

| 指标 | Phase 72（3000 tick） | Phase 80（3840 tick） |
|------|----------------------|----------------------|
| 最佳 unanimousBases | **3/4** | 2/4 |
| 碱基 1 | 3+/1- | 2+/2- |
| 结论 | 当前最优 | 延长 tick + 多节律**未改善** |

- GAP-10：**partial** — Phase 72 仍为最佳记录；碱基 1 持续开放
- 可证伪路径：单纯延长时间不足以闭合 GAP-10；需代次深度或选择通道强化
- 禁止脚本化选择；下一步可考虑 W2-only 栈（剥离 W3–W5 层）或代次深度攻坚

---

*Phase 80 · GAP-10 攻坚 weak · Phase 72 记录保持*
