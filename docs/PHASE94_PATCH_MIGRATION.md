# Phase 94 · GAP-ENV patch 迁徙 [MIG]

> **一条主因果**：高压 → 邻格 patch 迁徙 → alt 税 → `birthPlace` 更新。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `migEnabled` on 时有迁徙次数与税 | 与 off 无差 |
| H2 | 高压阻断（migStressMin 高）减少迁徙 | 无差 |
| H3 | 与 ADV/LTC/air 可并存 | 互相遮蔽 |
| H4 | 最终 patch 偏离起点 | 无位移 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| MIG | `src/world/mig.js` |
| alt | `patchAlt(patch)` = (row+col)/4 |
| 田野 | `npm run field:phase94` |

### 机制

- 每 `migInterval` tick：若 meanStress ≥ 阈值 → 向 `migTargetPatch` 邻格移动
- alt 差越大 → 迁徙税越高（寄存器扣减）
- 日志：`[MIG] from→to alt tax`

### 处理组

| ID | 说明 |
|----|------|
| `mig_off_ref` | 无迁徙 |
| `mig_on_ref` | 00→11 迁徙 |
| `mig_on_block` | 高压阻断 |
| `mig_on_fast` | 加速迁徙 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| on vs off | **4/4 support**；moveΔ≈14–16，taxΔ≈46–54 |
| **综合** | **support** |

报告：`docs/field-phase94-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 94（patch 迁徙 + alt 税）
- **下一步**：W6 全栈耦合验收田野

---

*MIG 是 patch 位移与税，不是地理移民实体。*
