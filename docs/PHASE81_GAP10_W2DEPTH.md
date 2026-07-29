# Phase 81 · GAP-10 W2-only 栈 + 代次深度攻坚

> **智慧栈 W2 第二轮攻坚**：在 Phase 72 最佳记录（3/4）基础上，测试 W2 纯演化栈与放宽 MEI 代次深度，目标 4/4 unanimous。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | Phase 72 配置复现 ≥3/4 unanimous | 复现 ≤2/4 |
| H2 | W2 纯栈（无记忆/EHU 深化）提升共识 | 与完整栈无差异或更差 |
| H3 | 放宽 MEI（minAge 28、cooldown 48）使 maxGen ≥4 | meanMaxGen < 4 |
| H4 | 深度 MEI + 剧变改善碱基 1 共识 | 碱基 1 仍 2+/2- |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 处理组 | `PHASE81_TREATMENTS` in `env-profile.js` |
| 验收 | `scripts/lib/phase81-analyze.js` |
| 田野 | `npm run field:phase81` |

### 处理组（3000 tick）

| ID | 说明 |
|----|------|
| `w2_p81_replay_ref` | Phase 72 基线复现 |
| `w2_p81_replay_shk` | Phase 72 剧变复现 |
| `w2_p81_core_shk` | W2 纯栈（无 mem/EHU 深化）+ 剧变 |
| `w2_p81_depth_shk` | 深度 MEI + 剧变 |

---

## 三、田野结果（2026-07-29）

12体 × **3000** tick × 4 种子

| 处理组 | unanimousBases | meanMaxGen | 碱基 1 | 存活 |
|--------|----------------|------------|--------|------|
| w2_p81_replay_ref | 2/4 | 2.5 | 1+/3- | ✓ |
| w2_p81_replay_shk | 1/4 | 2.0 | 1+/3- | ✓ |
| w2_p81_core_shk | **2/4** | 2.25 | 1+/3- | ✓ |
| w2_p81_depth_shk | 1/4 | 2.25 | **3+/1-** | ✓ |

- Phase 72 配置**未能复现** 3/4（复现仅 1–2/4）— 暴露随机方差
- 深度 MEI 使碱基 1 达 **3+/1-**（与 Phase 72 一致），但整体仅 1/4 unanimous
- meanMaxGen **2.0–2.5**，未达深度目标 ≥4
- 综合 **unsupport**；GAP-10 **仍开放**

报告：`docs/field-phase81-report.json`

---

## 四、与 Phase 72 / 80 对照

| 指标 | Phase 72 | Phase 80 | Phase 81 |
|------|----------|----------|----------|
| 最佳 unanimousBases | **3/4** | 2/4 | 2/4 |
| 碱基 1 最佳 | 3+/1- | 2+/2- | 3+/1-（depth） |
| meanMaxGen | ~2–3 | ~2–3 | ~2–2.5 |

- GAP-10：**partial** — Phase 72 单次田野仍为历史最佳；复现不稳定
- W2 纯栈与深度 MEI **未闭合** GAP-10
- 碱基 1 在 depth_shk 下重现 Phase 72 水平，提示 MEI 调参方向有效但不足以 4/4

---

*Phase 81 · GAP-10 攻坚 unsupport · 智慧物种田野验收准备*
