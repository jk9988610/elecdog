# 多细胞 v2 世界 · 哺乳生物完整生命周期立项

> **2026-07-30** 观察层：1 `being` = 1 只多细胞 organism；机制层 **`LOG-*` 逻辑细胞** + **`STR-*` 体表结构** + **全身调节场**。  
> 地球器官名（嘴/眼/耳/鼻/皮肤/脐带/乳房等）**仅出现在本文与观察台类比**，不进 CODEX 机制名表。

---

## 一、立项北极星

在电子狗世界中 **尽量完备地模拟哺乳类生物全过程**：

| 层级 | 要求 |
|------|------|
| **基本功能完备** | 诞生→胚胎→婴幼儿→性成熟→交配→宫内发育→分娩→哺乳→成体维持→衰老/END；摄取、呼吸、代谢、繁殖、种群存续可观察 |
| **重点功能完善** | **神经调节**（五感→整合→行为）、**激素调节**（分泌→全身向量→各细胞类型增益）、**结构匹配**（交配凹凸、哺乳/脐带接触摄取） |
| **发育正确性** | 受精卵/干细胞 → 体内有丝分裂 → **按位置 + 按生命阶段窗** 分化；≠ 诞生时随机满配 13 类 |
| **DNA 可表达** | 96 位四态串分区表达体轴、形态、激素、神经、感官、稳态；见 [DNA_EXPRESSION.md](DNA_EXPRESSION.md) |

**与种群层分裂区分**：

| 事件 | 语义 | 通道 |
|------|------|------|
| 体内有丝 `MIT` | 同 `being` 内细胞 +1（同型或干细胞） | `[MIT]` |
| 分化 `DIFF` | STEM/ZYG → `LOG-*`（受阶段窗限制） | `[DIFF]` |
| 减数 `MEI` | 成体生殖，半态/排出 | `[MEI]`（已有） |
| 种群分裂 `FISS` | **新 `being`** 进种群 | `[FISS]`（≠ 体内 MIT） |

---

## 二、三层对象（细胞 · 结构 · 调节场）

```text
being（1 身份证）
 ├─ logicCells LOG-*     … 可分裂、可分化、≤8/类（功能单元）
 ├─ structures STR-*     … 体表接口（少套、固定槽位；凹凸/脐带/哺乳口）
 ├─ subCells sc*         … Phase 35 代谢子域（通道位置，继续跑）
 ├─ skinMembrane MBR-SKN … 整 organism 外边界（1 层）
 ├─ hormoneVec           … 全身激素向量（organism 级场）
 └─ neuralCoupling       … 神经整合增益（接 LOG-NRV/BRN）
```

- **分化** 决定 `logicCell.code`。  
- **结构** 决定 **对外接口**（交配、哺乳、脐带、感官开口）。  
- **激素/神经** 调节 **所有逻辑细胞类型的有效活性**（不是每个细胞单独存激素）。

---

## 三、生命阶段（三段 + 宫内，无「体外胚胎」）

| 阶段 | 码 | 时间锚 | 分裂与分化要点 |
|------|-----|--------|----------------|
| **宫内胚胎** | `GEST` | 合胞后、载体 B 体内 `syncyte` | 脐带供养（MV1b）；膜/屏障/运输等 **宫内** DIFF |
| **婴幼儿** | `JUV` | **排出/诞生瞬间起** `tickCount < juvenileTicks` | 出生即幼体；STEM→MIT/DIFF；禁减数 |
| **成体** | `ADT` | `tickCount ≥ juvenileTicks` | 生殖、激素、减数；同型 MIT |

**不设「体外胚胎 EMB」窗**：哺乳动物模型中胚胎在宫内完成早期发育，**分娩/排出后即为幼体**，不在诞生后再叠一段体外胚胎期。

配置项：`gestationTicks`（宫内）、`juvenileTicks`（婴幼儿总长）。

---

## 三·二、逻辑细胞 ↔ 电子狗环境场（立项）

个体功能须 **匹配世界环境**，无场则无该功能（或仅记录 `[ENV-GATE]`）：

| 逻辑细胞 | 需要的环境场 | 世界模块 |
|----------|--------------|----------|
| `LOG-RES` 呼吸 | `[AIR]` 大气 scalar ≥ 阈值 | `air.js`、W6 环境栈 |
| `LOG-SEN-TM` 温度感 | 日相 solar + 大气 + 季相 + 地热 | `diurnal`、`air`、`seasonal`、`vent` |
| `LOG-DIG` 摄取 | 基底场 / 基质 `substrate` | `substrate.js` |
| `LOG-SEN-OL` 嗅觉 | 基质挥发 / SYM | `substrate`、`sym` |

实现：`src/world/env-cell-coupling.js` — `sampleOrganismEnv`、`envAllowsLogicCode`；`[CEL-LOG]` 附带 `envCoupling` 快照。

**分化门控**：`LOG-RES` 仅在 `hasBreathableAir` 时可从 STEM DIFF；无空气时已有呼吸细胞记 `[ENV-GATE] AIR`。

---

## 四、感官与「器官」· 逻辑细胞 + 结构出口

观察者类比 → **机制双层**（细胞负责功能，结构负责体表开口/场耦合）。

| 观察者类比 | 逻辑细胞 | 结构出口 | 输入源 | 分化窗主 | 观察通道 |
|------------|----------|----------|--------|----------|----------|
| **皮肤·触觉** | `LOG-SEN-TH` | `STR-SKN` | 接触/场压/Contest | JUV | `[SEN] kind:th` |
| **皮肤·温度** | `LOG-SEN-TM` | `STR-SKN` | 日相+AIR+季相+VTN 温度代理 | JUV | `[SEN] kind:tm` |
| **嘴·味觉** | `LOG-SEN-GU` | `STR-ORAL` | 摄取基质量/化学标量 | JUV | `[SEN] kind:gu` |
| **眼·视觉** | `LOG-SEN-VS` | `STR-VIS` | 场通量/信号视觉负载 | JUV | `[SEN] kind:vs` |
| **耳·听觉** | `LOG-SEN-AU` | `STR-AUD` | 其他个体 `[TX]`/场脉冲 | JUV | `[SEN] kind:au` |
| **鼻·嗅觉** | `LOG-SEN-OL` | `STR-OLF` | `substrate`/SYM 挥发 | JUV | `[SEN] kind:ol` |

**神经整合链**（重点完善）：

```text
LOG-SEN-* → [SEN] → LOG-NRV（整合、时序）→ LOG-BRN（记忆/意识耦合）
         → 调制 LOG-MOT/LOG-LNG/LOG-SIG-TX 输出
         → 反馈上调/抑制 LOG-HRM 分泌
```

---

## 五、摄取、信号、代谢（必要细胞）

| 观察者类比 | 逻辑细胞 | 机制锚点 | 分化窗 |
|------------|----------|----------|--------|
| 消化 | `LOG-DIG` | `sc0` draw、`[DRW]` | EMB→JUV |
| 生物质摄取 | `LOG-ING` | SYM/储备/体外源、`STR-ING-IN` | JUV |
| 对外发送信号 | `LOG-SIG-TX` | 定向 `[TX]`、`STR-*` 或专用出口 | JUV |
| 接收其他个体信号 | `LOG-SIG-RX` | `[RX]`、与 `LOG-SEN-AU` 等耦合 | JUV |
| 语言/实质性言语 | `LOG-LNG` | 实质性 `[TX]`、`[THO]` | JUV 晚 |
| 运动 | `LOG-MOT` | `sc1` act、`[ACT]` | JUV |
| 呼吸 | `LOG-RES` | `air`/氧通道 | EMB |
| 运输/营养路由 | `LOG-NTR`/`LOG-TRP` | `[INTRA]`、跨边界 | EMB |
| 储能 | `LOG-STR` | reservoir、registers | JUV |
| 清除 | `LOG-CLR` | `[DSP]` | JUV |

---

## 六、女性载体专用 · 脐带与哺乳（立项明确）

机制仍用 **pairMorph B（接纳方）** + 结构码，不用地球性别名表。

| 观察者类比 | 逻辑细胞 | 结构 | 阶段 | 机制说明 |
|------------|----------|------|------|----------|
| **脐带供养细胞** | `LOG-UMB` | `STR-UMB` | **GEST** 为主 | 宫内合胞 `syncyte` 阶段，经脐带通道将营养物质从 **载体 B** 代谢池输向胚胎；记录 `[UMB]` |
| **哺乳分泌细胞** | `LOG-LAC` | `STR-LACT-OUT` | **ADT** 泌乳窗 | 合成并向外分泌营养基质；与 `LOG-NUT` 协同 |
| **营养合成** | `LOG-NUT` | — | JUV→ADT | 前体→可传递营养；宫内/泌乳共用前体池 |

**体外哺乳（幼体摄取必须接触结构）**：

```text
母：LOG-LAC 活跃 + hormoneVec.h2 高 + STR-LACT-OUT 通量 > 0
婴：independent=false（或 JUV 早期），LOG-ING + STR-ING-IN
同 tick 几何/槽位 contact(STR-LACT-OUT, STR-ING-IN) = true
→ [LAC] 通量转移（寄存器/基质）；替代纯远程 nurtureReserve 衰减（nurture.js 增强）
```

**与现有 `nurture.js`**：`applyNurtureAtBirth` / `tickNurture` 保留为 **寄存器种子**；立项后 **接触成功时加成 [LAC]**，二者可并存。

---

## 七、交配结构 · 凹凸匹配（立项明确）

| 结构 | pairMorph | 观察者类比 | 机制 |
|------|-----------|------------|------|
| `STR-PAIR-OUT` | **A** 排出方 | 发射凸结构 | 绑 `sc1` act 通道子集；减数/半态从此出 |
| `STR-PAIR-IN` | **B** 接纳方 | 接收凹结构 | 绑 `sc0` draw；`dockedHalf` 落入 |

**匹配条件**（在现有 PAIR-3 `channelAffinity` 上升）：

1. A 的 OUT 与 B 的 IN **通道指纹交集 ≥ k**  
2. Z2 `morphHash` 兼容（DNA 表达）  
3. 社会位/距离/激素 `h1` 门控通过  

失败记 `[PAIR-MISMATCH]`；成功才允许握手/合胞/半态接纳。

---

## 八、激素：靠什么细胞？如何调节全身？

### 8.1 分泌细胞

- **专职**：`LOG-HRM`（≤8）— **激素生产细胞**。  
- **协助调制**（不替代分泌）：`LOG-NRV`、`LOG-BRN` 根据 `[SEN]`/`internal` 调节 **分泌速率**；`LOG-GON` 状态触发 **生殖激素脉冲**。

### 8.2 全身向量 `hormoneVec`

挂在 **being** 上（见 [DNA_EXPRESSION.md](DNA_EXPRESSION.md) Z3）：

| 分量 | 主要调节对象 |
|------|----------------|
| `h0` 生长代谢 | DIG/ING/RES/MIT 速率 |
| `h1` 生殖交配 | GON、STR-PAIR、meiGate、pairGateH |
| `h2` 宫内泌乳 | UMB/LAC/NUT、STR-UMB、STR-LACT-OUT |
| `h3` 应激修复 | CLR、integrity、BAR |
| `h4` 神经调制 | NRV/BRN 耦合、感觉增益 |

### 8.3 如何「控制全身各个细胞」

**不是** 激素认识每个细胞 id，而是 **类型级增益**：

1. 每类 `LOG-*` 有 `hormoneGain[code][hk]`（由 DNA Z1/Z6 + 分化阶段派生）。  
2. 每 tick：`activity[code] = base(code) × Π_k (1 + hormoneVec[k] × hormoneGain[code][k])`。  
3. 影响：该类 **MIT 概率、DIFF 是否允许、子域耦合强度、分泌反馈**。  
4. 记录：`[HRM]` 向量快照 + 可选 `[REG]` 全身调节摘要。

**神经调节并行**：感觉过载 → NRV → 抑制 HRM 或触发 h3 应激；意识/记忆负荷 → BRN → 调制 TX/LNG。

---

## 九、基础逻辑细胞总表（与 Phase 35 / 旧表合并）

| 观察者类比 | 逻辑码 | 上限 | 备注 |
|------------|--------|------|------|
| 皮肤外膜 | `MBR-SKN` | 1 层 | 非 8 计 |
| 脑细胞 | `LOG-BRN` | ≤8 | |
| 生殖细胞 | `LOG-GON` | ≤8 | ADT DIFF |
| 消化 | `LOG-DIG` | ≤8 | |
| 神经 | `LOG-NRV` | ≤8 | |
| 语言 | `LOG-LNG` | ≤8 | |
| 运动 | `LOG-MOT` | ≤8 | |
| 储能 | `LOG-STR` | ≤8 | |
| 营养运输 | `LOG-NTR` | ≤8 | |
| 氧质运输 | `LOG-TRP` | ≤8 | |
| 呼吸 | `LOG-RES` | ≤8 | |
| 屏障连接 | `LOG-BAR` | ≤8 | |
| 免疫清除 | `LOG-CLR` | ≤8 | |
| **激素分泌** | `LOG-HRM` | ≤8 | **全身调节核心** |
| **脐带滋养** | `LOG-UMB` | ≤8 | B + GEST |
| **哺乳分泌** | `LOG-LAC` | ≤8 | ADT 泌乳窗 |
| **营养合成** | `LOG-NUT` | ≤8 | |
| **摄取** | `LOG-ING` | ≤8 | |
| **信号发** | `LOG-SIG-TX` | ≤8 | |
| **信号收** | `LOG-SIG-RX` | ≤8 | |
| 触觉 | `LOG-SEN-TH` | ≤8 | |
| 温度 | `LOG-SEN-TM` | ≤8 | |
| 味觉 | `LOG-SEN-GU` | ≤8 | |
| 视觉 | `LOG-SEN-VS` | ≤8 | |
| 听觉 | `LOG-SEN-AU` | ≤8 | |
| 嗅觉 | `LOG-SEN-OL` | ≤8 | |

**说明**：逻辑细胞是 **population 计数 + 身份列表**，不是第二个 `being`。

---

## 十、社会位对细胞

**对逻辑细胞无独立含义。** 社会位是整只 organism 在种群层的标签；亲属用 `partnerId` / `pairParentA/B`。

---

## 十一、与旧版单细胞观察台

| 旧版 | v2 |
|------|-----|
| `being-card` | 隐藏；族谱 + 详情 |
| `subCell` draw/act/balance | 代谢子域；逻辑细胞功能层叠加 |
| 默认环境 | `multicell_v2_world` |

---

## 十二、分期路线图（修订）

### MV0 ✅ 骨架

- [x] 逻辑细胞表初版、`multicell-v2.js`、JUV/ADT、族谱 UI、#160/#162

### MV1a — 发育链 ✅

- [x] `STEM` 诞生；`GEST`/`JUV`/`ADT`（无体外胚胎窗）
- [x] `[MIT]` 体内有丝、`[DIFF]` 阶段窗
- [x] 去掉 `growLogicCellOnFiss` 随机逻辑
- [x] `[CEL-LOG]` 逻辑计数 + 环境耦合字段

### MV1b — 分化与宫内脐带 🔄

- [x] 各 `LOG-*` 的 `diffStages`（初版）
- [x] `LOG-UMB` + `STR-UMB` + `[UMB]` 通量（合胞载体 B）
- [ ] 田野核对宫内 DIFF 与 EXP 外排全链

### MV1c — 成体同型 MIT

- [x] `LOG-T → LOG-T`（ADT）；≤8/类
- [ ] STEM 池成体冻结、速率田野调参

### MV2 — 器官通路

- [ ] 分化细胞 ↔ `subCell` / TX / ACT / PAIR

### MV3 — 族谱持久

- [ ] END 灰显；云归档

### MV4 — UI 开关

- [ ] 经典单细胞观察子菜单

### MV5 — 五感

- [ ] `LOG-SEN-*`、`STR-ORAL/VIS/AUD/OLF/SKN`、`[SEN]`、Z5 表达

### MV6 — 结构匹配

- [ ] STR-PAIR 凹凸、`STR-UMB`、`STR-LACT`/`STR-ING`、接触摄取、`[PAIR-FIT]`/`[LAC]`/`[UMB]`

### MV7 — 激素与神经（重点）

- [ ] `LOG-HRM` 分泌链、`hormoneVec`、类型级 `hormoneGain`、Z3/Z4、`[HRM]`/`[REG]`

### MV8 — DNA 表达

- [ ] `dna-express.js`、田野验证；见 [DNA_EXPRESSION.md](DNA_EXPRESSION.md)

### MV9 — 哺乳生物田野验收

- [ ] 合胞→脐带→分娩→接触哺乳→性成熟→交配→再合胞 闭环田野 + 观察台复盘

---

## 十三、验证

```bash
npm run observer:multicell-v2    # 回归
# 计划新增：
npm run observer:dna-express:verify
npm run field:mv-lifecycle:verify
```

---

## 十四、立项检查表（基本完备 / 重点完善）

| 块 | 基本功能完备 | 重点完善 |
|----|--------------|----------|
| 发育 | ZYG→MIT→DIFF 分期 | 四段生命史 + 分化窗 |
| 五感 | 6 类 SEN 细胞 + 6 结构出口 | SEN→NRV→BRN 链 |
| 激素 | `hormoneVec` 存在 | LOG-HRM 分泌 + 全身类型增益 |
| 神经 | NRV/BRN 已有 | 与激素交叉调制 |
| 繁殖 | PAIR/MEI/FUS 已有 | STR 凹凸 + DNA morph |
| 宫内 | syncyte/gestation 已有 | LOG-UMB + STR-UMB 脐带 |
| 哺乳 | nurture 寄存器 已有 | LOG-LAC + 接触 STR |
| DNA | 96 位序列 已有 | Z1–Z6 分区表达 |
| 种群 | FISS/END/LINEAGE 已有 | 与体内 MIT 严格区分 |

---

*循序渐进；机制可观察 ≠ 定律已立；地球器官名不进 CODEX 机制表。*
