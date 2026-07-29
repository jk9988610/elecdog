# Phase 51 · 社会合作层 [COOP]

> **统计田野**：12 体 × **960 tick** × 4 种子；  
> 社会迹（RX/TX/ACT/contest）聚合为可观察模式，不命名角色或联盟。

---

## 一、内核扩展

| 机制 | 作用 |
|------|------|
| `accumulateCooperation` | 累计跨位 RX、TX、ACT、contest |
| `resolveCooperationMode` | S0 / SOLO / MESH / RIVAL / ECHO |
| `cooperationActBias` | 模式调制 ACT 阈值与偏好 |
| `processCooperationTick` | 模式跃迁时记录 `[COOP]` |

**模式判定**：

| 模式 | 条件 |
|------|------|
| S0 | 社会事件 < 20 |
| RIVAL | contest 率 > 12% |
| MESH | 跨位 RX 占比 > 45% |
| ECHO | TX 率 > 42% 且 TX > ACT |
| SOLO | RX 低 + contest 低 |

---

## 二、田野（960 tick × 4 种子 × 12 体）

| 处理组 | 说明 |
|--------|------|
| `fertile_no_coop` | 对照 |
| `fertile_coop_observe` | 仅观测 |
| `fertile_coop_feedback` | 观测 + 行为反馈 |
| `fertile_coop_dense` | 高种群上限 + 反馈 |

运行：`npm run field:phase51`

---

## 三、假说

| 假说 | 内容 |
|------|------|
| H1 | 观测组产生 `[COOP]` 跃迁 |
| H2 | MESH/RIVAL 模式可观察 |
| H3 | 反馈提高跨位 RX |
| H4 | 反馈增加 MESH 终态 |
| H5 | 不命名角色/联盟 |
| H6–H7 | 高密度增加 contest/RIVAL |

---

## 四、观察台

环境：**富足场+社会合作反馈** — `fertile_coop_feedback`

---

## 五、GAP-13

Phase 33 已证分工偏斜可观察、合作因果未确立；Phase 51 将**运行时社会迹档案**带入内核，仍禁止角色名与联盟语义。

---

*数据：`field-phase51-report.json`*
