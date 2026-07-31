# DNA 分区表达 · 多细胞哺乳生物立项

> **2026-07-30** · 与 [MULTICELL_V2_WORLD.md](MULTICELL_V2_WORLD.md) 配套  
> 机制层不设地球基因名；96 位四态串 **分区哈希表达**，观察可核对。

---

## 一、原则

1. **序列格式不变**：`createDna` / `mutate` / `reduceDna` 仍用 96 位 `0–3` 四态符。  
2. **表达 = 哈希派生**：与现码一致，`mulberry32(hashString(`${sequence}:Z{n}:tag`))`。  
3. **不预制密码子表**：分区语义写在 **本文 + 田野**，达标后归纳进 GENETICS / CODEX。  
4. **重点事件由 DNA + 阶段 + 细胞共同门控**：青春期激素、交配窗、泌乳窗、脐带通量等 **可观察、可复盘**。
5. **多细胞 v2 染色体遗传**（`src/genetics/genome.js`）：96 位拆为 **12 对 × 8 位** 同源染色体（对 1–2→Z1 … 对 11–12→Z6）；减数分裂前可按概率在同源间 **交叉互换**（断点 `互换@n`），再随机分离并记录同源来源；受精为卵单倍体 + 精单倍体合并为二倍体；**第 12 对为性染色体**（首位 `3` 为 Y，否则 X）；合子父源 Y → `pairMorph A`，否则 `pairMorph B`。表达：**Z3/Z4 偏共显性**、**Z1/Z6 偏强显性**、其余默认；再对 96 位表达串做 Z1–Z6 哈希。族谱登记压缩 `inheritSummary`；`[MEI]`/`[DCK]` 日志含 `cross 对:位点`。族谱模式底部 **繁殖进化流** 高亮带交叉的减数行，可 **跟随选中个体**、**MEI/DCK 类型筛选**；PRQ 近亲阻断支持 **全序列 + Z1–Z6 独立阈值**（`kinshipZoneBlockSim`，未配置区段回退 `kinshipDnaBlockSim`）。云归档/END 登记节点无 `genome` 时，详情仍展示 **inherit 登记** 与 **父母区段相似度**（基于 `dnaSequence`）。观察台云归档预览可 **载入族谱 / 个体快照 / 繁殖进化流** 到当前世界复盘（`applyGenealogyArchive` / `applyArchiveBeingSnapshots` / `mergeArchiveReproEvolution`）。繁殖进化流支持 **tick 时间窗**（近 50/100/200）。田野脚本 `observer-kinship-sibling-field` 可根据真实同胞样本 **建议 Z 区阈值**（`suggestKinshipZoneBlockSim`）。

---

## 二、区段划分（96 位）

| 区段 | 位索引 | 标签 | 主要表达产物 |
|------|--------|------|----------------|
| **Z1** | 0–15 | `axis` | 胚胎体轴 DIFF 优先级、`embryonicTicks` 偏置 |
| **Z2** | 16–31 | `morph` | `pairMorph` 倾向、STR 槽位 hash、凸凹通道子集 |
| **Z3** | 32–47 | `hormone` | 激素基线向量、分泌节律、泌乳/交配/青春期开关 |
| **Z4** | 48–63 | `neural` | 神经耦合强度、感觉→整合延迟、BRN 增益 |
| **Z5** | 64–79 | `sense` | 五感阈值与饱和（触/温/味/视/听/嗅） |
| **Z6** | 80–95 | `homeo` | 分裂冷却、幼体窗、独立阈值、组织 MIT 速率 |

> 注：Z4/Z5 边界可在实现时微调；**区段起点写入 `dna-express.js` 常量**，田野核对后再冻结。

---

## 三、Z3 激素表达（重点）

### 3.1 分泌源

- **唯一专职分泌细胞类型**：`LOG-HRM`（≤8）。  
- 每 tick（或每 N tick）：`LOG-HRM` 细胞数 × Z3 节律 × 体内状态 → 更新 `being.hormoneVec`。

### 3.2 向量形态（立项）

| 分量 | 码 | 作用对象（全身） |
|------|-----|------------------|
| `h0` | 生长/代谢 | `LOG-DIG`/`LOG-ING` draw 倍率、`[DRW]` 门控 |
| `h1` | 生殖/交配 | `pairGateH`、`meiAllowed`、STR-PAIR 发育 |
| `h2` | 泌乳/宫内 | `STR-UMB` 通量、`STR-LACT-OUT`、`LOG-LAC` 活性 |
| `h3` | 应激/免疫 | `LOG-CLR`、integrity 修复、`[DSP]` 分流 |
| `h4` | 神经调制 | `internalTxCoupling`、`LOG-NRV` 增益 |

### 3.3 全身控制方式（非「激素认识每一个细胞」）

1. **激素向量** `hormoneVec` 挂在 **整只 being**（organism 级场）。  
2. 各 `LOG-*` 类型有 **敏感度表** `hormoneGain[code][h_k]`，由 Z1/Z6 + 分化阶段派生。  
3. 每 tick：`effectiveGain = hormoneVec[k] * hormoneGain[code][k]` → 乘到该类型的 **MIT 概率、DIFF 许可、子域耦合、分泌反馈**。  
4. **神经并行**：`LOG-NRV`/`LOG-BRN` 可 **上调/下调** 激素分泌（第二调节轴），记录 `[NRV]` / `[HRM]`。

### 3.4 DNA 驱动的「自然发生」事件

| 事件 | 条件（可观察） |
|------|----------------|
| 青春期激素抬升 | `tickCount` 近 `juvenileTicks` + Z3 位 + `h1` 阶跃 |
| 交配窗打开 | `ADT` + `h1` > 阈值 + `LOG-GON` 已 DIFF |
| 宫内供养增强 | `syncyte` 存在 + `h2` 高 + `LOG-UMB`/`STR-UMB` 活跃 |
| 泌乳窗 | 产后 tick 窗 + `h2` 脉冲 + `LOG-LAC` DIFF |
| 应激皮质样脉冲 | 场压/integrity 低 + Z3 应激位 + `h3` 短脉冲 |

---

## 四、Z5 感官表达

与 `LOG-SEN-*` 绑定：每个感官类型从 Z5 子段读取 **阈值、饱和、噪声**。

| 感官细胞 | Z5 子标签 | 结构出口 |
|----------|-----------|----------|
| `LOG-SEN-TH` 触觉 | `sense:th` | `STR-SKN` |
| `LOG-SEN-TM` 温度 | `sense:tm` | `STR-SKN` |
| `LOG-SEN-GU` 味觉 | `sense:gu` | `STR-ORAL` |
| `LOG-SEN-VS` 视觉 | `sense:vs` | `STR-VIS` |
| `LOG-SEN-AU` 听觉 | `sense:au` | `STR-AUD` |
| `LOG-SEN-OL` 嗅觉 | `sense:ol` | `STR-OLF` |

输出统一进 `[SEN]` 通道，再经 `LOG-NRV` 整合。

---

## 五、Z2 形态与结构匹配

- `expressMorphHash(dna)` → STR-PAIR-OUT / STR-PAIR-IN **通道指纹** 与 **槽位 id**。  
- 交配：`channelAffinity(half, acceptor) + morphHashCompat(A, B)`。  
- 哺乳：`STR-LACT-OUT` 与幼体 `STR-ING-IN` **接触 tick** 才输运。  
- 脐带：`STR-UMB` 仅 **B + syncyte/宫内** 阶段开放，Z2 定通道对。

---

## 六、实现入口（计划）

| 模块 | 路径 |
|------|------|
| 分区常量与 express 函数 | `src/genetics/dna-express.js` |
| 激素向量更新 | `src/world/hormone-field.js` |
| 感官事件 | `src/world/sensory.js` |

---

## 七、验证（计划）

```bash
npm run observer:multicell-v2          # 回归
npm run observer:dna-express:verify    # 分区哈希稳定、Z3 节律可复现
npm run field:mv-hormone:verify        # 激素向量与 [HRM] 迹
```

---

*表达可核对 ≠ 定律已立；田野前先跑截止守卫田野。*
