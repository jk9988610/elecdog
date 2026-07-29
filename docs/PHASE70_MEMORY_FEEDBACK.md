# Phase 70 · W1 记忆→行为闭环

> **智慧栈第一层**：闭合「经历改变未来行为」；扭转 GAP-03「记忆迹不反馈」。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | 启用 `memoryFeedbackEnabled` 后，对外率与 ACT 占比与关闭组**有稳定差异** | 多组田野无差异 |
| H2 | 近期 RX 负载高时，对外阈值系统性变化 | 与 memRxLoad 无相关 |
| H3 | 差异不破坏对外同态（同 DNA+ID solo 仍可复现） | solo 对照崩坏 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 记忆负载累积 | `src/world/memory-feedback.js` |
| 引擎偏置合并 | `src/kernel/engine.js` |
| 环境 | `wisdom_evolution`（`consciousness_full` + `memoryFeedbackEnabled`） |
| 检查表 | `scripts/lib/wisdom-conditions.mjs` |
| 验证 | `scripts/wisdom-mem-verify.mjs` |

### 机制（最小）

- 个体维护衰减负载：`memRxLoad`、`memTxLoad`、`memActLoad`
- 每 tick 根据负载调制 `actBoost` / `thresholdDelta`（与阅历层同模式）
- **不预制**「记得」「遗忘」等地球语义；只记录可观察负载与偏置

---

## 三、田野（待 Phase 70 PR 后填充）

| 处理组 | 说明 |
|--------|------|
| `wisdom_mem_off` | 完整栈，无记忆反馈 |
| `wisdom_mem_on` | 完整栈 + 记忆反馈 |

运行：`npm run wisdom:mem:verify`（骨架）；长时批处理后续 `field:phase70`

---

## 四、与辞典关系

- **暂不修订** CODEX「事件记忆迹」条（仍描述记录层）
- 若 H1 跨 ≥2 OBS 支持 → 提议新条「记忆行为调制」或修订可证伪字段

---

*Phase 70 · 智慧演化线开工*
