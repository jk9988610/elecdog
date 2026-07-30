# Phase 105 · WL5 载荷共现迹 CODEX 立项（待确认）

> **一条主因果**：WL0–WL4 田野 support/weak + 观察台 UI 已交付 → 辞典新条「载荷共现迹」**立项就绪**，待您确认后写入 CODEX。

---

## 一、立项内容（草案）

| 项 | 结果 |
|----|------|
| 田野依据 | Phase 100 **support**（H1/H3/H4 4/4） |
| 正交依据 | Phase 103 **weak**（H1–H4 4/4） |
| 观察台 | Phase 104 UI 已交付 |
| CODEX 候选条 | **载荷共现迹**（第 32 条） |
| GAP-W06 | **部分结案** — 记录层可观察；反馈/持久 weak |

**禁止条名**：智慧语言、语言、对话、辞典、翻译

---

## 二、辞典修订（草案，未写入）

| 条 | 动作 |
|----|------|
| 次 tick 信号可达 | 备注链至「载荷共现迹」 |
| **载荷共现迹** | **新增** — `semEnabled` + `[SEM] pair {rx}→{tx}` + `semWindow` |

### 候选定义

- **定义**：启用 `semEnabled` 时，个体在 `semWindow`（默认 1 tick）内将收到的 `[RX]` 载荷 hex 键与随后发出的 `[TX]` 载荷 hex 键配对计数，记录为 `[SEM] pair {rxKey}→{txKey}`；可选 `semFeedbackEnabled` 对高共现对施加微弱 TX 偏置；可选 `semLineageEnabled` 写入 `[SEM-LIN]` 谱系迹。不设词汇表、句法或地球式「说话」命名。
- **依据**：OBS-20260729-99（Phase 100 support）、OBS-20260729-100（Phase 103 weak）
- **可证伪**：若 on/off 田野无 `[SEM]` 账本差、或 rx→tx 条件概率不可重复、或将载荷对等同于预制语义标签，则修订

验证：`npm run gap-w06:sem:codex`

---

## 三、田野依据

| 批次 | 结果 | 报告 |
|------|------|------|
| Phase 100 WL0 | **support** | `field-phase100-report.json` |
| Phase 101 WL1 | weak | `field-phase101-report.json` |
| Phase 102 WL2 | weak | `field-phase102-report.json` |
| Phase 103 WL3 | **weak**（H1–H4 4/4） | `field-phase103-report.json` |

---

## 四、OBS

- OBS-20260729-99（Phase 100 田野 support）
- OBS-20260729-100（Phase 103 正交 weak）
- OBS-20260729-101（Phase 104 观察台 UI）

---

## 五、出口

| 项 | 状态 |
|----|------|
| 立项就绪验证 | `npm run gap-w06:sem:codex` |
| CODEX 写入 | ⏳ **待您确认** |
| GAP-W06 | 部分结案（确认后） |

---

*载荷共现是统计事实，不是词典条目。*
