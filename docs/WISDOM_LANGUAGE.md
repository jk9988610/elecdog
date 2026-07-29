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
WL0  Phase 100  [SEM] 载荷共现记录层          ← 当前
        ↓
WL1  Phase 101  semFeedbackEnabled 行为偏置   （100 support 后）
        ↓
WL2  Phase 102+ 跨 tick / 跨代约定持久
        ↓
WL3  Phase 103+ 与 W4 社会知识正交对照田野
        ↓
WL4  Phase 104+ 观察台类比 UI（田野 support 后）
        ↓
WL5  Phase 105+ CODEX 归纳（≥2 OBS，非「语言」地球名）
```

### WL0 · 记录层（Phase 100）

| 项 | 内容 |
|----|------|
| 机制 | `semEnabled` + `[SEM] pair {rxHash}→{txHash}` |
| 旗标 | `semWindow`（默认 1）、`semMinCount`、`semFeedbackEnabled=false` |
| 田野 | `npm run field:phase100` — `sem_off_ref` / `sem_on_ref` / `sem_on_dense` / `sem_on_sk` |
| 假说 | H1 可观察、H3 记录无行为偏差、H4 RX→次 tick TX 条件模式 |
| 文档 | [PHASE100_SEMANTIC_SIGNAL.md](PHASE100_SEMANTIC_SIGNAL.md) |

### WL1 · 反馈层（Phase 101，待立项）

| 项 | 内容 |
|----|------|
| 前提 | Phase 100 批次 **support** 或 **weak** 且 H3 全种子达标 |
| 机制 | `semFeedbackEnabled`：高共现对 → 微弱 TX 载荷偏置（非词典查询） |
| 田野 | on/off 对照：约定迹是否放大传递优势 |
| 禁止 | 直接写「懂了」「对话」 |

### WL2 · 持久层（Phase 102+）

| 项 | 内容 |
|----|------|
| 问题 | 约定迹是否跨 tick / 跨个体 / 跨代可核对残留 |
| 机制候选 | `[SEM-LIN]` 谱系回响、与社会迹 `[SOC-ENC]` 分离 |
| 验收 | 去掉持久机制后，H4 条件模式消失 |

### WL3 · 社会正交（Phase 103+）

| 项 | 内容 |
|----|------|
| 问题 | 约定迹 vs W4 频次编码是否独立可证伪 |
| 田野 | `sem_on` × `socialKnowledge on/off`  factorial |
| 关联 | GAP-W06 与 GAP-13/W4 边界 |

### WL4 · 观察台类比（Phase 104+）

| 项 | 内容 |
|----|------|
| 前提 | 田野 support |
| UI | `analogy.js` 增加 `sem_*` 列：「发–收型」「约定迹条数」 |
| 约束 | 工具栏标注：**类比呈现 · 非辞典 · 非语言定义** |

### WL5 · CODEX 归纳（Phase 105+）

| 项 | 内容 |
|----|------|
| 门槛 | ≥2 独立 OBS、您确认、仍不用地球式「语言/对话」条名 |
| 候选表述 | 「载荷–回复共现可重复」「次 tick 条件模式可观察」 |

---

## 三、与 GAP / Phase 对照

| ID | 名称 | Phase | 状态 |
|----|------|-------|------|
| GAP-W06 | 信号约定/文化层 | 100–101 | 100 实现中 |
| — | 持久约定 | 102+ | 未启动 |
| — | 社会正交 | 103+ | 未启动 |
| — | 类比 UI | 104+ | 设计就绪，等田野 |
| — | CODEX | 105+ | 禁止预制 |

---

## 四、WORKFLOW 位置

```
观察 TX/RX 链 → OBS
  → WL0 [SEM] 记录 + field:phase100
  → 若 support → WL1 反馈
  → WL2 持久 → WL3 社会正交 → WL4 UI → WL5 CODEX
```

每步：**实现 → 田野 → 文档 → PR → 合并 → HANDOFF 指向下一步**。

---

*载荷共现是统计事实，不是词典条目。智慧语言是长期演化目标，不是一次性 UI 功能。*
