# Phase 79 · W1 田野复核 + CODEX 修订

> **智慧栈 W1 结案**：Phase 70 田野复核 support → 辞典新条「记忆行为调制」立项。

---

## 一、复核内容

| 项 | 结果 |
|----|------|
| 田野重跑 `field:phase70` | H1 **4/4 support**（升级自 3/4） |
| 方向一致 | ✓ |
| mem_on memAct 负载 | **0.599** |
| CODEX 新条 | **记忆行为调制**（第 29 条） |
| GAP-W01 | **结案** |

---

## 二、辞典修订

| 条 | 动作 |
|----|------|
| 事件记忆迹 | 可证伪条件细化（关闭反馈时不改变行为） |
| **记忆行为调制** | **新增** — `memoryFeedbackEnabled` → 负载 → 行为偏置 |

验证：`npm run wisdom:w1:review`

---

## 三、田野结果（复核 2026-07-29）

| 处理组 | 对外率 | memAct |
|--------|--------|--------|
| wisdom_mem_off | 0.495 | 0 |
| wisdom_mem_on | 0.469 | 0.599 |

报告：`docs/field-phase70-report.json` · `docs/w1-codex-review-report.json`

---

## 四、OBS

- OBS-20260729-81（初田野）
- OBS-20260729-90（复核 + CODEX 立项）

---

*Phase 79 · W1 结案 · GAP-10 待续*
