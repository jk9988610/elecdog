# Phase 71 · W2 选择压可重复性度量

> **智慧栈第二层**：统一 DNA 漂移 + SEL 筛选的跨种子可重复性指标；为 Phase 72 环境强化提供基线。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | 多代田野中 DNA 频率偏移可观察（drift ≥ 0.02） | 无偏移或 maxGen < 3 |
| H2 | `[SEL]` 通道与 END 共现可核对 | selCount = 0 且 endCount > 0 |
| H3 | 跨种子漂移方向 `signConsistent` 可报告 | 4 种子全部分歧 |
| H4 | `majorityDriftConsensus` ≥ 2 碱基 unanimous | 0/4 unanimous（GAP-10 持续） |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| W2 度量 | `scripts/lib/phase71-analyze.js` |
| 处理组 | `w2_evo_cat` / `w2_evo_ctrl`（智慧演化场 × 剧变对照） |
| 田野 | `scripts/field-batch-phase71.mjs` |
| 运行 | `npm run field:phase71` |

### 度量输出

- `signConsistent` — 跨种子漂移方向一致（继承 Phase 21/22）
- `unanimousBases` — 各碱基漂移方向的多数票共识（0–4）
- `meanDrift` / `meanSEL` — 处理组均值
- `gap10Status` — `open` / `partial` / `closed`
- `verdict` — `metrics_ready` / `weak_signal` / `gap10_persists`

---

## 三、田野基线（2026-07-29）

| 处理组 | signConsistent | unanimousBases | meanDrift | meanSEL |
|--------|----------------|----------------|-----------|---------|
| w2_evo_cat | false | 1/4 | 0.016 | 0 |
| w2_evo_ctrl | false | 1/4 | 0.019 | 0 |

- 综合：**gap10_persists**（GAP-10 仍开放）
- 度量通道：**已建立**（`metrics_ready` 基础设施）
- Phase 72 目标：强化选择压环境，推动 ≥ 2/4 碱基 unanimous

报告：`docs/field-phase71-report.json`

---

## 四、与 GAP-10 / GAP-W02 关系

- Phase 71 **不脚本化**选择压力，仅建立可核对度量
- GAP-10 状态维持开放；基线已登记供 Phase 72 对照
- GAP-W02 进入 **度量已就绪 → 环境攻坚** 阶段

---

*Phase 71 · W2 度量基线 · Phase 72 选择压强化环境*
