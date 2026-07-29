# Phase 50 · 代谢通道层 [MTB]

> **统计田野**：12 体 × **960 tick** × 4 种子；  
> 摄取通道 e0–e7 分布可运行时追踪，不命名资源类型。

---

## 一、内核扩展

| 机制 | 作用 |
|------|------|
| `accumulateMetabolicDraw` | 按通道累计 DRW 摄取量与 LOW 次数 |
| `resolveMetabolicProfile` | N0 / DOM / BAL / SCAR 档案 |
| `metabolicDrawMultAdjust` | 档案调制摄取倍率 |
| `processMetabolicProfileTick` | 档案跃迁时记录 `[MTB]` |

**档案判定**（纯数值）：

| 档案 | 条件 |
|------|------|
| N0 | 摄取事件 < 20 |
| SCAR | LOW 率 > 8% |
| DOM | 单通道占比 > 50% |
| BAL | 单通道占比 < 35% |

**摄取反馈**：

| 档案 | drawMult 调整 |
|------|---------------|
| DOM | +0.06 |
| BAL | 0 |
| SCAR | −0.10 |

---

## 二、田野（960 tick × 4 种子 × 12 体）

| 处理组 | 说明 |
|--------|------|
| `fertile_no_mtb` | 对照 |
| `fertile_mtb_observe` | 仅观测 |
| `fertile_mtb_feedback` | 观测 + 摄取反馈 |
| `harsh_mtb_feedback` | 高压 + 反馈 |

运行：`npm run field:phase50`

---

## 三、假说

| 假说 | 内容 |
|------|------|
| H1 | 观测组产生 `[MTB]` 跃迁 |
| H2 | 主导通道占比可观察 |
| H3 | 反馈组 DOM 占比更高 |
| H4 | SCAR 档案在高压下增多 |
| H5 | 不命名资源类型 |
| H6–H7 | 高压下摄取与匮乏档案 |

---

## 四、观察台

环境：**富足场+代谢通道反馈** — `fertile_mtb_feedback`

---

## 五、GAP-11

回答「消耗什么」仍禁止预制资源表；Phase 50 提供**通道索引级分布**与**匮乏型档案**，可观察 LOW 与摄取竞争。

---

*数据：`field-phase50-report.json`*
