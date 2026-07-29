# Phase 92 · GAP-ART 持久 [ART] 场态原型

> **一条主因果**：累积 `[ACT]` → 寄存器成本沉积持久场态 → 局域 floor 微注入 + DRW 效率提升。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `artEnabled` on 时有沉积与 floorInject | 与 off 无差 |
| H2 | 活跃 ART 提高 drawBonus（DRW 效率） | 无增益 |
| H3 | 与 ADV/LTC/air 全栈可并存 | 互相遮蔽 |
| H4 | 非脚本化：须真实 ACT  streak + 寄存器成本 | 无 ACT 也能沉积 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| ART | `src/world/art.js` |
| 沉积触发 | `engine.js` ACT 后 `tryArtDeposit` |
| 效率 | `drawMult` + `artMods.drainReduce` |
| 田野 | `npm run field:phase92` |

### 机制

- ACT streak 达阈值 → 消耗寄存器 → 创建 `artifact`（channel、ttl、floorBoost、drwBonus）
- 每 tick `tickArt` 维持 floor 微注入；过期自动清除
- **禁止**脚本化 `if 造工具 then +10%`

### 处理组

| ID | 说明 |
|----|------|
| `art_off_ref` | 全栈无 ART |
| `art_on_ref` | ART 参考 |
| `art_on_boost` | 强化沉积频率/增益 |
| `art_on_sparse` | 稀疏沉积对照 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| on vs off | **4/4 support**；depositΔ≈2895–2980，injectΔ≈2175–2241 |
| **综合** | **support** |

报告：`docs/field-phase92-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ART 记录层原型（硬工具场态）
- **中期路线 §10.3 完成**：Phase 84–92 全部交付
- **下一步**：Phase 94 patch 迁徙 / 高程 alt

---

*ART 是持久场态结构，不是石器或建筑名称。*
