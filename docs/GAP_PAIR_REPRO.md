# GAP-PAIR · 双源体内合胞繁殖

> **GAP-PAIR-0（Phase 124）**：跳过握手、关闭有丝分裂（`[FISS]`），形态 A/B 各持 **1 个半态**，B 体内合胞 → 宫内通量 → 外排 → 依赖期。

---

## 一、设计原则

| 原则 | 说明 |
|------|------|
| 数字原生 | 机制标签：`[MEI]` `[DCK]` `[FUS-IN]` `[EMB]` `[EXP]` `[NUR]` |
| 无地球 CODEX 名 | 不设精子/卵子/受精/性别/哺乳/受体通道 |
| 半态 singleton | 形态 A/B 各至多 1 个半态，数学上 1 个即可 |
| 无受体通道 | 简化模型不绑定 `e0–e7`；后期可映射到 subCell / `r_k` |
| 渐进演化 | PAIR-0 → 半态排入场 → 握手 → 专用通道 |

---

## 二、PAIR-0 流程

```
形态A [MEI] → halfPacket（≤1）
形态B [DCK] → dockedHalf（≤1，出生可预置）
        ↓ 激素门控 h（B 寄存器−场）
形态B [FUS-IN] → syncyte（体内合胞）
        ↓ gestationTicks
形态B [EMB] → 寄存器通量耦合
        ↓
形态B [EXP] → 外排独立个体
        ↓
形态B [NUR] → 依赖期至 independent
        ↓
子代 [DRW] 环境摄取
```

**激素标量**（PAIR-0）：

\[
h = \bar{r} - 0.35 \cdot \bar{e},\quad h > 0.08 \Rightarrow \text{允许 [FUS-IN]}
\]

---

## 三、田野（Phase 124）

| 处理组 | FISS | 路径 |
|--------|------|------|
| `ev124_pair_min` | 关 | 体内合胞 PAIR-0 |
| `ev124_pair_ctrl_instant` | 关 | 旧式即时 `[FUS]` |
| `ev124_pair_ctrl_fiss` | 开 | 克隆对照 |

```bash
npm run field:phase124
npm run field:phase124:verify
```

队列：4 体（2×形态A + 2×形态B）· 1920 tick · 4 种子

---

## 四、演化路线图

| 阶段 | 内容 |
|------|------|
| **PAIR-0** ✅ | 体内合胞、无握手、无通道 |
| **PAIR-1** ✅ | 半态 `[FLD]` 排入环境场 → B `[FLD-IN]` 摄取 |
| **PAIR-2** ✅ | `[PRQ]`/`[PGR]` 许可握手后排 `[FLD]` |
| PAIR-3 | 排出/接受绑定 subCell 或 `r_k` |
| PAIR-4 | 多维激素向量 \(h\) |

---

## 五、与 `e0–e7` 的关系

- **PAIR-0**：合胞槽 `syncyte` 为抽象数据结构，**不**占用基底八通道。
- **后期**：可将「排出半态」绑定到某 `subCell`，「接受」绑定到 `r_k` 阈值或局部 `e_k` 富集——那时「通道」才有可测物理含义。

---

## 六、PAIR-1 流程（Phase 125）

```
形态A [MEI] → halfPacket
        ↓ 同 tick 末
环境场 [FLD] release（world.fieldHalves，singleton/源）
        ↓ 社会位亲和趋近
形态B [FLD-IN] + dockedHalf → [FUS-IN] → …（同 PAIR-0 后续）
```

| 处理组 | pairHalfRelease |
|--------|-----------------|
| `ev125_pair_field` | ✅ |
| `ev125_pair_body` | ❌（PAIR-0 对照） |

```bash
npm run field:phase125
npm run field:phase125:verify
```

---

## 七、PAIR-2 流程（Phase 126）

```
形态A [MEI] → halfPacket
        ↓ 同 tick 末（握手开启时）
形态A [PRQ] → world.pairRequests（社会位广播）
        ↓ 形态B 激素门控 h > 0.08
形态B [PGR] → A.pairGrantFrom = B.id
        ↓ 仅持有效许可
形态A [FLD] release → …（同 PAIR-1 后续）
```

| 处理组 | pairHandshake |
|--------|---------------|
| `ev126_pair_handshake` | ✅ |
| `ev126_pair_nohandshake` | ❌（PAIR-1 对照，无 PRQ） |

```bash
npm run field:phase126
npm run field:phase126:verify
```

---

*立项：2026-07-30 · Phase 124 首验 · Phase 125 PAIR-1 · Phase 126 PAIR-2*
