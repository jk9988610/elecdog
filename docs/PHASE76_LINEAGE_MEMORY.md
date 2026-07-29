# Phase 76 · W4 谱系记忆回响

> **智慧栈 W4 续行**：亲代 mem 摘要经 `[MEM-LIN]` 传递至子代，与 W1 记忆→行为闭环联动。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | on 组 `[MEM-LIN]` 可观察 | memLinCount < 2 |
| H2 | 子代携带回响 mem 负载 | withEchoCount < 1 |
| H3 | on/off 对外率有可观察差异（W1 联动） | \|Δ\| < 0.0008 |
| H4 | 回响子代 vs 种子体对外率差异 | gap < 0.005 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 记忆回响 | `lineage-memory.js` — `applyMemLineageEcho()` |
| 谱系挂钩 | `fission.js` / `lineage.js` / `recombination.js` |
| W1 联动 | 子代 `memRxLoad`/`memTxLoad`/`memActLoad` 播种 → `memoryActBias` |
| 田野 | `npm run field:phase76` |

### 机制（最小）

- 分裂/谱系/FUS 时亲代 mem 负载 × blend → 子代初始 mem 态
- `[MEM-LIN]` 记录回响摘要（EHU-LIN 式）
- 子代经 W1 闭环持续调制行为
- **不预制**「遗传记忆」「文化」等地球语义

---

## 三、田野结果（2026-07-29）

12体 × 1920 tick × 4 种子（含 Phase 75 社会知识层）

| 处理组 | MEM-LIN | echo# | echoAct | 对外率 | 回响子代 |
|--------|---------|-------|---------|--------|----------|
| w4_mem_echo_off | 0 | 0 | 0 | 0.371 | — |
| w4_mem_echo_on | **52** | **52** | **0.277** | 0.366 | 0.343 |

- H1 MEM-LIN 可观察：**4/4 support**
- H2 回响播种：**4/4 support**
- H3 W1 行为联动：**3/4 support**
- H4 子代差异：**4/4 support**
- 批次综合：**support**

报告：`docs/field-phase76-report.json`

---

## 四、与 GAP-W04 关系

- GAP-W04：**结案** — Phase 75 社会迹 + Phase 76 谱系回响闭合
- W4 跨代知识累积完整交付
- Phase 77+ 启动 W5 长时开放演化田野

---

*Phase 76 · W4 谱系回响 support · W5 长时层待续*
