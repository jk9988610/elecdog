# Phase 93 · GAP-ENV 地热 vent [VTN]

> **一条主因果**：标记 patch `vent` → 局域基底微注入 + boost/floor 调制；极带 P 生存缝。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `ventEnabled` 且 patch 匹配时有 inject | 与 off 无差 |
| H2 | vent 错位（patch≠ventPatch）无注入 | 错位仍有注入 |
| H3 | 与 ADV/LTC/air 全栈可并存 | 互相遮蔽 |
| H4 | 极带 P + vent 改善基底均值 | 无 substrate 差 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| VTN | `src/world/vent.js` |
| floor/boost | `place.js` `ventMods` |
| 田野 | `npm run field:phase93` |

### 机制

- `ventPatch` 与 `placePatch` 匹配 → 每 tick 向多通道微注入
- `ventMods`：`boostMult`、`floorAdd`（与 `[SHK]` 独立）
- 日志：`[VTN] place inject boost×…`

### 处理组

| ID | 说明 |
|----|------|
| `vent_off_ref` | 极带 P、无 vent |
| `vent_on_ref` | 极带 P、patch 11 vent |
| `vent_on_mismatch` | vent 在 00、身在 11 |
| `vent_on_boost` | 强化注入 |

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| on vs off | **4/4 support**；injectΔ≈13–14，activeΔ=1920 |
| **综合** | **support** |

报告：`docs/field-phase93-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 93（地热 vent 记录层）
- **下一步**：Phase 94 patch 迁徙 / 高程 `alt`

---

*vent 是局域微源标记，不是火山或温泉实体。*
