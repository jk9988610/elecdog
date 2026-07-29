# Phase 53 · 繁殖路径层 [RPR]

> **统计田野**：12 体 × **960 tick** × 4 种子；  
> 在四层档案之上追踪 LINEAGE / FISS / RCM 繁殖起源与亲代活动（GAP-14）。

---

## 一、内核扩展

| 机制 | 作用 |
|------|------|
| `classifyBirthOrigin` | SEED / LIN / FIS / RCM 起源标记 |
| `recordReproductionPathEvent` | 亲代 FISS / LINEAGE 活动计数 |
| `resolveReproductionMode` | R0 → SEED_DOM / LIN_DOM / FIS_DOM / RCM_DOM / MULTI |
| `reproductionActBias` | 路径模式调制 ACT |
| `[RPR]` | 模式跃迁记录 |

---

## 二、田野（960 tick × 4 种子 × 12 体）

| 处理组 | 说明 |
|--------|------|
| `stack_no_rpr` | 四层反馈，无 RPR |
| `stack_rpr_observe` | 四层 + RPR 观测 |
| `stack_rpr_fiss` | 四层 + RPR + 仅 FISS |
| `stack_rpr_tri` | 四层 + RPR + 三路径（FISS+MEI/FUS） |

运行：`npm run field:phase53`

---

## 三、假说

| 假说 | 内容 |
|------|------|
| H1 | RPR 跃迁可观察 |
| H2 | 多起源可追踪 |
| H3 | 仅-FISS 组 FIS_DOM 增多 |
| H4 | FISS 繁殖量保持 |
| H5–H7 | 三路径 + 四层并存 |

---

## 四、观察台

环境：`fertile_stack_rpr_tri`

---

## 五、GAP-14

谱系（LINEAGE）与存活分裂（FISS）、重组（RCM）可在同一档案栈下**操作性区分**与追踪。

---

*数据：`field-phase53-report.json`*
