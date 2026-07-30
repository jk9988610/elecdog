# Phase 101 · WL1 [SEM] 反馈偏置层

> **一条主因果**：高共现载荷对 → 微弱 TX 偏置（非词典查询）；约定迹是否放大传递优势。  
> **前提**：Phase 100 support（WL0 已交付）。

---

## 一、机制

| 旗标 | 作用 |
|------|------|
| `semFeedbackEnabled` | 开启反馈（需 `semEnabled`） |
| `semFeedbackStrength` | 偏置强度（默认 0.05） |
| `semFeedbackMinPairs` | 触发反馈的最小共现次数 |
| `semFeedbackSaturation` | 强度饱和分母 |

实现：`semActBias` + `applySemPayloadHint` in `src/world/sem.js`；`Being.emitExternal` 接入 TX/载荷偏置。

---

## 二、假说与田野

| ID | 内容 | 结果 |
|----|------|------|
| H1 | 条件概率 top-1 反馈组 > 记录组 × 1.05 | ⚠️ 1/4 support |
| H2 | TX 偏置可观察（fbHits 或 TX 比变化） | ✅ 4/4 support |
| H3 | `[SEM]` 仍可观察 | ✅ 4/4 support |
| H4 | 共现事件数不下降 | ✅ 3/4 support |
| H5 | 对外率无失控偏差 | ✅ 4/4 support |

**综合**：**weak**（H2+H3+H5 达标；H1 未全种子 support）

---

## 三、处理组

| ID | 说明 |
|----|------|
| `sem_record` | SEM 记录，无反馈 |
| `sem_feedback` | SEM 记录 + 反馈偏置 |
| `sem_fb_dense` | 宽窗口 + 反馈 |
| `sem_fb_sk` | 剧变 + 反馈 |

```bash
npm run field:phase101
```

报告：`docs/field-phase101-report.json`

### 均值（2026-07-29）

| 处理组 | SEM | top1Cond | fbHits | TX比 | 对外率 |
|--------|-----|----------|--------|------|--------|
| sem_record | 0 | 0.875 | 0 | 0.499 | 0.368 |
| sem_feedback | 4083 | 1.0 | 82.3 | 0.517 | 0.369 |
| sem_fb_dense | 18135 | 0.869 | 179.7 | 0.552 | 0.359 |
| sem_fb_sk | 0 | 1.0 | 0.65 | 0.479 | 0.357 |

---

## 四、出口

| 项 | 状态 |
|----|------|
| WL1 反馈内核 | ✅ |
| 田野 `field:phase101` | ✅ weak |
| 下一步 | **WL2** 跨 tick/跨代约定持久 |

---

*反馈是统计偏置，不是「懂了」。*
