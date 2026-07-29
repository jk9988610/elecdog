# Phase 86 · GAP-ENV terrain L/O + `[PCP]` 水循环

> **一条主因果**：`birthPlace` 扩展为 `{band}-{patch}-{L|O}`；`atmoStore` 蓄放 → `[PCP]` 补场；陆海通道分布可观察。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | terrain L/O 改变基底 e1（海格）与 e2 初值 | L/O 无通道差 |
| H2 | `pcpEnabled` on 时 `pcpInject` > 0 | on/off 无注入差 |
| H3 | 海格 e1 高于陆格（同 band） | e1 无差 |
| H4 | PCP 为第二补给源（与 DRW 并列） | 蓄池永不释放 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 地形 | `place.js` `TERRAIN_PARAMS` L/O |
| 水循环 | `pcp.js` `atmoStore` + `tickPcp` |
| 节点弱化 | `nodes.js` 海格 regen/hit 倍率 |
| 引擎 | DLC 后 PCP → advanceSubstrate |
| 田野 | `npm run field:phase86` |

### birthPlace 格式

```
M-00-L   中带 · 陆格
M-00-O   中带 · 海格
```

### 通道语义

- **e1（e◈）**：海格基线偏高；陆格偏低
- **`[PCP]`**：日相蒸发蓄 `atmoStore` → 阈值触发多通道补场（陆格广撒；海格偏 e1）

### 处理组

| ID | 说明 |
|----|------|
| `pcp_off_L` | 无 PCP · 陆格 |
| `pcp_off_O` | 无 PCP · 海格 |
| `pcp_on_L` | PCP · 陆格 |
| `pcp_on_O` | PCP · 海格 |

（均含 band M + `[DLC]` 日相）

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| PCP on vs off（陆格） | inject Δ ≈ **0.92**；4/4 种子 **support** |
| 陆 vs 海（PCP on） | e1 海格高 **+0.05~0.12**；4/4 **weak** |
| DRW/LOW 分布 | 田野 stat 下计数稀疏（0 END） |

- **PCP 可观测 ✓**（events + totalInject）
- 综合：**weak** — PCP 记录层强支持；陆海 DRW 差待更长 tick 或迁徙网格

报告：`docs/field-phase86-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 86（terrain + PCP 记录层）
- **下一步**：Phase 87 `[SCL]` 季相四相

---

*`[PCP]` 是相态转移记录，不是雨；L/O 是格点地形代号，不是陆海名。*
