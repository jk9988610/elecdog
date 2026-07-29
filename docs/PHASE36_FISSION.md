# Phase 36 · 富足分裂场（DNA 旺盛分裂倾向）

> **目标**：建立一种环境，使 DNA 在**亲代存活**时即可复制并诞生新个体（`[FISS]`），  
> 而非仅在 `[END]` 后 `[LINEAGE]` —— 类比地球生物在富足、低胁迫条件下的细胞分裂。

---

## 一、地球对照 → 电子狗操作定义

| 地球 | 电子狗 Phase 36 |
|------|-----------------|
| 营养充足、生长因子到位 | 基底场 e0–e7 **均值高**（`substrateBoost` + `substrateFloor`） |
| 低胁迫、无 DNA 损伤检查点 | **场压低**（`fissionMaxStress`）、无 `[LOW]` 连击 |
| 膜完整、体积够大 | `fissionMinIntegrity` + `fissionMinAge`（存活 tick） |
| 分裂程序由 DNA 编码 | `dnaFissionParams`：偏置 `bias` 影响冷却与分裂概率 |
| 有丝分裂（亲代存活） | `[FISS]` — 亲代不 END，子代新身份证 |
| 减数/配子 | **未实现** |
| END 后繁殖 | 仍为 `[LINEAGE]`（死亡续行） |

**与 Phase 34–35 的差别**：

- harsh：`[END]` → `[LINEAGE]` 周转高，但幼体难活 → 「死得多、生得多、留不下」  
- **fertile_field**：`[FISS]` 在富足场中旺盛 → 「活得好、分得勤、种群涨」

---

## 二、环境配置 `fertile_field`

| 参数 | 值 | 作用 |
|------|-----|------|
| `substrateDrainMult` | 0.52 | 耗竭慢 |
| `substrateBoost` | 0.02 | 每 tick 补给场态 |
| `substrateFloor` | 0.54 | 通道下限托底 |
| `catastropheDisabled` | true | 无 SHK/NPL 脉冲 |
| `fissionEnabled` | true | 开启分裂门 |
| `fissionBaseProb` | 0.58 | 门控通过后基础概率 |
| `fissionCooldown` | 32 tick | 亲代分裂间隔 |

**对照组 `fertile_inert`**：同等富足基底，**`fissionEnabled: false`** — 验证「场 alone」不产分裂。

---

## 三、内核

| 文件 | 职责 |
|------|------|
| `src/world/fission.js` | `fissionGate`、`spawnFissionOffspring`、`[FISS]` |
| `src/world/substrate.js` | `substrateBoost` / `substrateFloor` |
| `src/world/catastrophe.js` | `catastropheDisabled` |
| `src/kernel/engine.js` | 代谢后、END 前尝试分裂 |

分裂时：亲代寄存器 ×0.9（分裂代价）；子代 DNA `mutate` 1.2%；`generation` 不变（体细胞式）。

---

## 四、田野

```bash
npm run field:phase36
```

四环境 × 四种子：baseline · fertile_field · fertile_inert · harsh_combined

假说：

| ID | 内容 |
|----|------|
| H1 | fertile_field 的 `[FISS]` 显著高于 baseline |
| H2 | 存活个体数增长（>4） |
| H3 | 分裂不依赖 `[LINEAGE]` 高周转 |

---

## 五、GAP-16

**存活分裂 vs 死亡续行** — 见 [GAPS.md](GAPS.md)

---

*不设「有丝分裂」「植物分生」等 CODEX 名；仅 `[FISS]` 事实通道。*
