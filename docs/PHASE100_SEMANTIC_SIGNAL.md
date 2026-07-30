# Phase 100 · GAP-W06 信号约定记录层 [SEM]

> **一条主因果**：`[TX]` 载荷若与他者次 tick 行为/回复载荷形成**可重复共现**，则记录为 `[SEM]` 约定迹；**仍不叫语言/对话**。  
> **阶段定位**：WL0 记录层（智慧语言长期目标第一步）；反馈层见 [WISDOM_LANGUAGE.md](WISDOM_LANGUAGE.md) WL1。

---

## 一、问题陈述

### 已有（L5a）

| 事实 | CODEX / 田野 |
|------|----------------|
| `[TX]` / `[ACT]` 对外双型 | 对外双型 |
| 次 tick `[RX]` 可达 | 次 tick 信号可达 |
| RX 增加内在行 | 信号附加内在 |
| RX 衍生 hex 可决 | 协议层，非开放语义 |
| 三体/四体信号链 | 多跳可观察 |
| `[SOC-ENC]` / `[COOP]` | 频次编码、模式档案（W4 部分） |

### 缺失（L5c · 文化层）→ Phase 100 部分闭合

- ~~载荷与**可核对后果**之间无稳定映射~~ → `[SEM]` pair 可观察
- 跨 tick / 跨个体**约定持久** → WL2 待启动
- on/off 田野 → ✅ `field:phase100` support

**禁止**：预制词汇表、句法、翻译表、或类比 UI 直接写「它们在说话」。

---

## 二、假说（可证伪）

| ID | 内容 | 田野结果 |
|----|------|----------|
| H1 | `semEnabled` on 时，`[SEM]` 约定迹可观察 | ✅ 4/4 种子 support |
| H2 | 高共现载荷对 bigram Jaccard on > off × 1.08 | ⚠️ unsupport（非综合门槛） |
| H3 | **记录层**：on/off 对外率无系统偏差（\|Δ\| < 0.04） | ✅ 4/4 support |
| H4 | RX→次 tick TX 条件模式 top-1 > 基线 1.15× | ✅ 4/4 support |
| H5 | 与 W4 正交 | WL3 待启动 |

**综合判定**：**support**（H1+H3+H4）

---

## 三、机制（已交付）

### 3.1 通道

- evolution 子类：`[SEM]`  
- 格式：`[SEM] pair {rxHash}→{txHash} count {n}`  
- 实现：`src/world/sem.js`；引擎接入 `src/kernel/engine.js`

### 3.2 配置旗标

| 旗标 | 作用 |
|------|------|
| `semEnabled` | 开启共现统计与 `[SEM]` 日志 |
| `semWindow` | 向后看窗口（默认 1 tick） |
| `semMinCount` | 写入 `[SEM]` 的最小共现次数（ref=1） |
| `semFeedbackEnabled` | **Phase 101 / WL1**；本 Phase 保持 false |

### 3.3 处理组

| ID | 说明 |
|----|------|
| `sem_off_ref` | W5 智慧栈，无 SEM |
| `sem_on_ref` | W5 + SEM 记录 |
| `sem_on_dense` | 宽窗口 + 富信号场 |
| `sem_on_sk` | 剧变脉冲扰动 |

---

## 四、田野

```bash
npm run field:phase100
```

- 12 体 × 1920 tick × 4 种子 × 4 处理组  
- 报告：`docs/field-phase100-report.json`

### 处理组均值（2026-07-29）

| 处理组 | SEM 条数 | 载荷对种类 | top1Cond | 对外率 |
|--------|----------|------------|----------|--------|
| sem_off_ref | 0 | 0 | 0 | 0.363 |
| sem_on_ref | 263546 | 263546 | 1 | 0.369 |
| sem_on_dense | 2102 | 513027 | 0.625 | 0.366 |
| sem_on_sk | 0.25 | 237389 | 1 | 0.359 |

---

## 五、类比 UI 映射（设计，不进 CODEX）

实现于 `analogy.js`，**仅当田野 support 后**启用展示列（WL4）：

| 原版 | 类比（辅助） |
|------|----------------|
| `[SEM] pair` | 反复出现的「发–收」型 |
| `semCount` | 约定迹条数 |

---

## 六、通讯介质（设计约束）

| 维度 | 规则 |
|------|------|
| 场域 | 同世界实例、同观察 cohort |
| 时间 | 次 tick 可达 |
| 格式 | TX/ACT 双型，各 3 字节 |
| 耦合 | TX 不改环境；ACT 才 RES/TGT/PTB |

---

## 七、WORKFLOW 位置

```
观察 TX/RX → Phase 100 [SEM] ✅
  → WL1 Phase 101 semFeedbackEnabled ✅ weak
  → WL2 Phase 102 持久层（下一迭代）
```

---

## 八、出口

| 项 | 状态 |
|----|------|
| GAP-W06 登记 | ✅ |
| 内核 `[SEM]` | ✅ `sem.js` |
| 田野 `field:phase100` | ✅ support |
| 智慧语言长期路线 | ✅ `WISDOM_LANGUAGE.md` |
| CODEX | ❌ 禁止预制 |
| 类比 UI | ⏳ WL4 |

---

*载荷共现是统计事实，不是词典条目。*
