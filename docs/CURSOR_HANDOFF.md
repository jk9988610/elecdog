# Cursor 新对话交接

> 更新：2026-07-30 · **哺乳生物完整生命周期立项** · MV0 ✅

---

## 战略状态

| 轨道 | 状态 |
|------|------|
| WL-R + 云辞典 33 条 | ✅ 闭合 · 仅回归 |
| **MV0** 多细胞 v2 骨架 | ✅ #160/#162 |
| **哺乳生物立项** | ✅ [MULTICELL_V2_WORLD.md](MULTICELL_V2_WORLD.md) + [DNA_EXPRESSION.md](DNA_EXPRESSION.md) |
| **下一实现** | **MV1a** 发育链（ZYG/STEM、MIT/DIFF、四段生命史） |

**进度距离**：见 [GOAL_DISTANCE.md](GOAL_DISTANCE.md)

---

## 立项要点（必读）

1. **三层**：`LOG-*` 细胞 + `STR-*` 结构 + `hormoneVec` 调节场  
2. **四段**：`GEST`（宫内脐带）→ `EMB` → `JUV` → `ADT`  
3. **五感**：`LOG-SEN-TH/TM/GU/VS/AU/OL` + `STR-SKN/ORAL/VIS/AUD/OLF`  
4. **激素**：仅 `LOG-HRM` 专职分泌 → `hormoneVec` → 各细胞 **类型级** `hormoneGain`  
5. **神经**：SEN → NRV → BRN，并行调制激素与行为  
6. **女性载体 B**：`LOG-UMB` + `STR-UMB` 脐带供养胚胎；`LOG-LAC` + `STR-LACT-OUT` 体外哺乳（幼体 `STR-ING-IN` **接触**摄取）  
7. **交配**：`STR-PAIR-OUT`（A 凸）↔ `STR-PAIR-IN`（B 凹），通道 + DNA morph 匹配  
8. **DNA**：Z1–Z6 分区表达，见 [DNA_EXPRESSION.md](DNA_EXPRESSION.md)  
9. **体内 MIT/DIFF ≠ 种群 `[FISS]`**

---

## 验证

```bash
npm run observer:multicell-v2
npm run observer:repro-speech
```

---

## 关键文件

| 文档 | 路径 |
|------|------|
| 哺乳生物立项总图 | `docs/MULTICELL_V2_WORLD.md` |
| DNA 分区表达 | `docs/DNA_EXPRESSION.md` |
| 逻辑细胞（待扩 SEN/UMB/LAC） | `src/world/logic-cell-types.js` |
| 多细胞 v2 | `src/world/multicell-v2.js` |
| PAIR / 激素 | `src/world/pair-repro.js` |
| 哺乳寄存器（待接接触 LAC） | `src/world/nurture.js` |

---

*立项文档优先；实现按 MV1a→MV9 路线图，勿跳过发育链直接满配细胞。*
