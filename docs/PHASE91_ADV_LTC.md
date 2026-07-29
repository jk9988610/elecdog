# Phase 91 · GAP-ENV [ADV] 邻格平流 + [LTC] 月相

> **两条主因果**：邻格 patch 通道差 → `[ADV]` 平流；月相潮汐 → 节点再生调制 + e◐ 微注入。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `advEnabled` on 时有平流事件与 flux | 与 off 无差 |
| H2 | `ltcEnabled` on 时 regenMult 波动、LTC 相变可观测 | 无潮汐 |
| H3 | ADV 与 DLC/PCP/SCL/air 可并存 | 互相遮蔽 |
| H4 | 仅 ADV 或仅 LTC 可独立启用 | 必须捆绑 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| ADV | `src/world/adv.js` |
| LTC | `src/world/ltc.js` |
| 节点再生 | `nodes.js` × `lunarMods.regenMult` |
| 田野 | `npm run field:phase91` |

### ADV 平流

- 3×3 patch 网格邻接（00–22）
- 每 `advInterval` tick：邻格虚拟池与本地基底交换 Δe
- 顺带扩散 `[BIO]` residue 小量

### LTC 月相

- `T_moon = 28` tick（≠日相整数倍）
- `tide = sin(2π·tick/T)` → `regenMult = 1 + amp×tide×scale`
- 高潮时向 `e3`（LUNAR_CHANNEL）微注入

### 处理组

| ID | 说明 |
|----|------|
| `adv_ltc_off` | 全栈无 ADV/LTC |
| `adv_ltc_on` | ADV + LTC 全开 |
| `adv_on_only` | 仅 ADV |
| `ltc_on_only` | 仅 LTC |

（含 DLC + PCP + SCL + air + reservoir）

---

## 三、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子

| 对照 | 结果 |
|------|------|
| on vs off | **4/4 support**；advΔ=160，fluxΔ≈6.8–9.4，ltcΔ=274 |
| **综合** | **support** |

报告：`docs/field-phase91-report.json`

---

## 四、出口与下一步

- **已交付**：GAP-ENV Phase 91（ADV 平流 + LTC 月相记录层）
- **下一步**：Phase 92 GAP-ART 原型（持久 `[ART]` 场态 + 效率田野）

---

*`[ADV]`/`[LTC]` 是数字相位与平流通量，不是风与月球实体。*
