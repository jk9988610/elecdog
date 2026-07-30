# 智慧语言 · 长期路线图（WISDOM LANGUAGE）

> **北极星（2026-07-29）**：在数字原生世界中，逐步形成**可观察、可证伪、可演化**的「智慧语言」能力——**不是**地球式自然语言、词典或对话 UI，而是载荷共现、约定迹与跨代传递的统计–机制层。  
> **与 WISDOM 主栈关系**：智慧语言是 **L5c 文化层**（GAP-W06）的专项长期目标，依附 W1–W5 已建栈，每步一条主因果 + on/off 田野。

---

## 一、操作定义（本项目内）

| 维度 | 是 | 不是 |
|------|----|------|
| 对象 | `[TX]`/`[RX]` 三字节载荷、次 tick 可达 | 声波、电磁波、人类词汇 |
| 证据 | `[SEM]` 共现对、条件概率、跨种子 Jaccard | 「它们在说话」的叙事标签 |
| 演化 | 记录 →（可选）反馈 → 持久 → 社会正交 | 预制句法、翻译表、脚本变聪明 |
| CODEX | ≥2 OBS + 您确认后，仍禁止地球式「语言」名 | 辞典条目、语法规则条 |

**通讯介质约束**（数字原生）：同世界实例、次 tick 信号总线、`[TX]` 不改环境 / `[ACT]` 改环境。见 [PHASE100_SEMANTIC_SIGNAL.md](PHASE100_SEMANTIC_SIGNAL.md) 第六节。

---

## 二、里程碑分解（WL0–WL5）

```
协议层 TX/RX（已有）
        ↓
WL0  Phase 100  [SEM] 载荷共现记录层          ✅ support
        ↓
WL1  Phase 101  semFeedbackEnabled 行为偏置   ✅ weak
        ↓
WL2  Phase 102  跨 tick / 跨代约定持久          ✅ weak
        ↓
WL3  Phase 103  与 W4 社会知识正交对照          ✅ weak（640 tick）
        ↓
WL4  Phase 104  观察台类比 UI                  ✅ 已交付
        ↓
WL5  Phase 105+ CODEX 归纳（≥2 OBS）           ← 立项就绪，待确认
```

### WL0 · 记录层（Phase 100）

| 项 | 内容 |
|----|------|
| 机制 | `semEnabled` + `[SEM] pair {rxHash}→{txHash}` |
| 旗标 | `semWindow`（默认 1）、`semMinCount`、`semFeedbackEnabled=false` |
| 田野 | `npm run field:phase100` — `sem_off_ref` / `sem_on_ref` / `sem_on_dense` / `sem_on_sk` |
| 假说 | H1 可观察、H3 记录无行为偏差、H4 RX→次 tick TX 条件模式 |
| 文档 | [PHASE100_SEMANTIC_SIGNAL.md](PHASE100_SEMANTIC_SIGNAL.md) |

### WL1 · 反馈层（Phase 101）

| 项 | 内容 |
|----|------|
| 前提 | Phase 100 support ✅ |
| 机制 | `semFeedbackEnabled`：高共现对 → 微弱 TX 载荷偏置 |
| 田野 | `npm run field:phase101` — record vs feedback |
| 结果 | **weak**（H2/H3/H5 达标） |
| 文档 | [PHASE101_SEM_FEEDBACK.md](PHASE101_SEM_FEEDBACK.md) |

### WL2 · 持久层（Phase 102）

| 项 | 内容 |
|----|------|
| 机制 | `[SEM-LIN]` 谱系回响 + `semTrace` 可继承摘要 |
| 田野 | `npm run field:phase102` |
| 结果 | **weak**（H4/H5 达标；H1/H2/H3 部分） |
| 文档 | [PHASE102_SEM_LINEAGE.md](PHASE102_SEM_LINEAGE.md) |

### WL3 · 社会正交（Phase 103）

| 项 | 内容 |
|----|------|
| 田野 | `npm run field:phase103` — 2×2 factorial · **640 tick** |
| 结果 | **weak**（H1–H4 4/4） |
| 文档 | [PHASE103_SEM_SOC_ORTHOGONAL.md](PHASE103_SEM_SOC_ORTHOGONAL.md) |

### WL4 · 观察台类比（Phase 104）

| 项 | 内容 |
|----|------|
| UI | `sem-stack.js` + `analogy.js` `sem_*` |
| 环境 | `observer_wl_stack` |
| 验证 | `npm run observer:sem-stack` |
| 文档 | [PHASE104_SEM_STACK_UI.md](PHASE104_SEM_STACK_UI.md) |

### WL5 · CODEX 归纳（Phase 105，立项就绪）

| 项 | 内容 |
|----|------|
| 门槛 | ≥2 OBS ✅ · **待您确认**写入 CODEX |
| 候选条 | **载荷共现迹**（非「语言/对话」条名） |
| 验证 | `npm run gap-w06:sem:codex` |
| 文档 | [PHASE105_SEM_CODEX.md](PHASE105_SEM_CODEX.md) |

---

## 三、与 GAP / Phase 对照

| ID | 名称 | Phase | 状态 |
|----|------|-------|------|
| GAP-W06 | 信号约定/文化层 | 100–105 | WL0–WL4 已交付 |

---

## 四、WORKFLOW 位置

```
观察 TX/RX 链 → OBS
  → WL0–WL3 ✅ → WL4 UI ✅ → WL5 CODEX（待确认）
```

每步：**实现 → 田野 → 文档 → PR → 合并 → HANDOFF 指向下一步**。

---

*载荷共现是统计事实，不是词典条目。智慧语言是长期演化目标，不是一次性 UI 功能。*
