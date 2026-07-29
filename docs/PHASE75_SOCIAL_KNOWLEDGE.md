# Phase 75 · W4 社会知识累积

> **智慧栈第四层**：RX 频次编码 → 可继承社会迹 `[SOC-ENC]` / `[SOC-LIN]`；子代行为可对照差异。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | on 组 `[SOC-ENC]` 可观察 | socEncCount < 15 |
| H2 | 谱系/分裂继承 `[SOC-LIN]` 发生 | socLinCount < 3 |
| H3 | on/off 对外率有可观察差异 | \|Δ\| < 0.001 |
| H4 | 子代与种子体对外率差异可测 | 子代 gap < off 组 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 社会迹编码 | `social-knowledge.js` — `updateSocialEncode()` |
| 谱系继承 | `applySocialKnowledgeInheritance()` in fission/lineage |
| 行为偏置 | `socialKnowledgeActBias()` → `mergeActBias` |
| 田野 | `npm run field:phase75` |

### 机制（最小）

- 每 tick 累积 RX/crossRX → `[rxShare, crossShare, intensity]` 编码
- 分裂/谱系时亲代编码+迹混合 → 子代 `socTrace`
- 继承迹调制 `actBoost` / `thresholdDelta`
- **不预制**「文化」「知识」等地球语义

---

## 三、田野结果（2026-07-29）

12体 × 1920 tick × 4 种子

| 处理组 | SOC-ENC | SOC-LIN | trace | 对外率 | 子代率 |
|--------|---------|---------|-------|--------|--------|
| w4_soc_off | 0 | 0 | 0 | 0.472 | 0.472 |
| w4_soc_on | **75632** | **40** | **0.324** | 0.371 | 0.312 |

- H1 SOC-ENC 可观察：**4/4 support**
- H2 继承事件：**4/4 support**
- H3 行为调制：**4/4 support**
- H4 子代差异：**4/4 support**
- 批次综合：**support**

报告：`docs/field-phase75-report.json`

---

## 四、与 GAP-W04 关系

- GAP-W04：**结案** — Phase 75 社会迹 + Phase 76 谱系回响闭合
- Phase 77+ 启动 W5 长时开放演化田野

---

*Phase 75 · W4 社会累积 support · 谱系层待续*
