# 智慧演化 · 后续目标与基底本体论

> 归纳自 Phase 83 之后的讨论（2026-07-29）。  
> **本文是路线与假说，不是已实现机制**；扩展须走 WORKFLOW + GAP 立项 + 田野证伪。

---

## 一、后续目标总览

| 代号 | 主题 | 核心问题 | 状态 |
|------|------|----------|------|
| **GAP-ART** | 环境「硬工具」与创造力 | 持久世界结构 → 可测效率增益 | 待立项 |
| **GAP-11+** | 基底本体论与耗散定律 | 消耗物是什么、用于什么、70% 去哪了 | 部分开放 |
| **GAP-ORG** | 内共生模块与能量储备 | 像线粒体/叶绿体：内部生产+储存，而非只从环境 DRW | 待立项 |
| **W4 软工具** | 社会性程序工具 | `[SOC-ENC]` / `[MEM-LIN]` 传递高效模式 | 已有 W4，待与 GAP-ART 区分 |

**维护态**：W1–W5 + Phase 82 验收 **prepared**；L2 partial 上限已接受（Phase 83）。上述为**新 GAP 驱动扩展**。

---

## 二、基底代谢：消耗了什么、用于什么

### 2.1 观测事实

- 每 tick 从数字基底场 `e0–e7` 扣减，`metabolism` 通道记 `[DRW] e{n} −δ`
- 摄取量 ∝ 活动量（内在行数 + 是否对外）；多细胞按子域轮值摄取
- **约 30%** 进入个体寄存器 `r_n`；**其余在实现层耗散**（未回到场、未入账）
- `e_n < 0.12` → `[LOW]`（匮乏事实，≠ 饥饿）
- `stress` = \|r−e\| 与匮乏合成 → 行为阈值改变 → 持续则 `[END]`

### 2.2 「为什么需要生存条件」

数字世界里**存活** = 寄存器–场耦合过程持续 tick；`[END]` = 过程终止。

| 需要 | 原因 |
|------|------|
| 基底场不长期枯竭 | DRW 唯一来源是 `e_n` |
| 摄取通量 ≥ 活动耗散 | 否则 \|r−e\| 恶化、stress 累积 |
| 避免长期 LOW / stress streak | 规则触发 END |
| LINEAGE / FISS / FUS | 个体过程会 END；延续的是信息线 |

### 2.3 数字「热力学」假说（待田野）

| 地球 | 电子狗世界（提议抽象） |
|------|------------------------|
| 自由能 | 基底通道高度 `e_n` |
| 有用功 | 部分 DRW → `r_n` 补给 |
| 耗散 | DRW 未进入 `r` 的份额 + 场层 retain/噪声/`substrateDrainMult` |
| 不完整回收 | `[BIO]` 生物圈 residue 部分还场 |
| 死亡 | `[END]` |
| 繁殖 | `[LINEAGE]` 等 — 信息接续，非热力学个体永生 |

**GAP-11 仍禁止**：将基底命名为食物、ATP、光能等地球资源名。

---

## 三、创造力与工具（GAP-ART 方向）

人类式工具链在数字世界的可证伪形态：

1. **硬工具**：持久场态/节点结构 → 后续 DRW 或 stress 系统性改善（on/off 田野）
2. **软工具**：社会迹传递行为模式（已部分由 W4 覆盖）
3. **身体工具**：繁殖路径竞争（FISS/FUS/MEI — 已有演化层）

禁止：脚本化 `if 造工具 then 效率+10%`。

---

## 四、地球细胞 → 数字个体：机制抽象（GAP-ORG 方向）

> 目标：**可简化，但要有「内共生 + 内部储能 + 多级联合体」的机制感**。  
> 不设叶绿体/线粒体/细胞壁等地球名称；用可观察通道与数据结构对应。

### 4.1 已有基础（可复用）

| 地球（类比） | 电子狗世界（已实现） | 通道/结构 |
|--------------|----------------------|-----------|
| 细胞膜 / 代谢域 | `cellBoundary`（4/8 通道） | `[CEL]` 完整性 |
| 细胞质 / 胞内代谢物 | 寄存器 `r0–r7` | internal |
| 外界物质 | 基底场 `e0–e7` | `[DRW]` `[LOW]` |
| 多细胞器分工 | `subCell` ×3，角色 draw/act/balance | `[INTRA]` |
| 多细胞个体 | 1 being = 多 subCell，一次 END | `[ORG] multicell` |
| 种群 | 多 being、多 ID | `[CMP]` `[SOC]` |
| 内共生捕获 | `[FUS]` / `[MEI]` 重组 | 谱系/DNA 混合 |
| 环境脉冲 | `[AMB]` `[SHK]` | environment |
| 活动废迹还场 | `[BIO]` | biotic residue |

### 4.2 提议扩展（未实现）

#### A. 内共生模块（线粒体 / 叶绿体类比）

- **定义**：being 内嵌**半自治子模块**，自有通道子集 + 每 tick 固定代谢规则；可与主体共享边界但**独立计数通量**
- **获得方式**：`[FUS]` / `[MEI]` 重组时以 packet 形式并入（=「捕获来的联合体」）
- **可观察**：`[SYM] module {id} draw|synth|store`；模块数、活性与 integrity 相关
- **两类模块（类比，非命名）**：
  - **Synth-A**：依赖 `[AMB]` 或高 `e_k` → 向内部 **储备池** 注能（光合类比）
  - **Synth-B**：从 **储备池** → 向 `r` 注能（呼吸类比）

#### B. 能量储备（淀粉类比）

- **定义**：与 `r` 分离的 **储备池 `reservoir[0..k]`**（0–1），不直接从环境 DRW 进 `r`
- **写入**：Synth-A 或低效 DRW 的「储存分支」
- **读出**：Synth-B 或 stress 期自动动用；动用记 `[RSV] out`
- **可证伪**：有/无储备池田野 — 剧变情境下 END 率、LOW streak 是否改善

#### C. 多级联合体（叶片类比）

```
内共生模块（SYM）
    ↓ 多个并入同一 being
subCell 分工（已有 draw/act/balance）
    ↓ 多个 being 协作（可选未来）
群体场耦合（已有 RX/TX/SOC）
```

- **叶片级**：不必新实体类型 — 可用 **多体 multicell + 胞内 INTRA + 共享基底区** 表达「组织」
- 若需更强区分：引入 **place** 或 **cohort** 级场态，多 being 共享局部 `e` 子向量

#### D. 细胞核 / 细胞壁（简化对应）

| 地球 | 数字简化 |
|------|----------|
| 细胞核（遗传信息中心） | **已有**：DNA + id；`[LINEAGE]` 不变 |
| 细胞壁（边界刚性） | **已有**：`cellBoundary` + `integrity`；可扩展为 **wallStiffness** 调制跨膜 DRW 成本 |
| 细胞液（区室介质） | **提议**：subCell 间 **intraPool** 缓冲，INTRA 转移先进入 pool 再分配 |

### 4.3 最小可交付路径（建议 Phase 84+）

1. **Phase A**：`reservoir` + `[RSV]` 记录层（只储存/动用，不命名淀粉）
2. **Phase B**：一种 Synth 模块（AMB→reservoir），田野对照 DRW-only
3. **Phase C**：FUS 并入 module packet（内共生捕获）
4. **Phase D**：与 GAP-ART 汇合 — 模块造出的 **场态结构** 是否反哺 Synth-A 效率

每步须 on/off 田野 + OBS，不预制地球器官名。

---

## 六、地球式环境周期与空间梯度（GAP-ENV 方向）

> 目标：**简化模拟**赤道–两极差异、四季、日夜、日月影响；**不叫温度/季节/太阳/月亮**；细胞有**可观察的诞生区位**。

### 6.1 现状与缺口

| 地球现象 | 今日实现 | 缺口 |
|----------|----------|------|
| 全球只有一个地点 | `birthPlace: '01'` | 无空间梯度、无迁徙（ENVIRONMENT §六） |
| 温度带 | 处理组静态 `substrateFloor`/`DrainMult` | 无 lat 连续变化 |
| 日夜 | 每 tick `[AMB]`（非日相） | 无昼夜周期调制 |
| 四季 | 无 | 无慢周期 |
| 月亮潮汐 | 无 | 无次要长周期 |
| 灾害 | `[SHK]`/`[NPL]` 每 100 tick | 类似突变，非季节 |

### 6.2 空间：细胞最初在哪里

**今日**：所有个体在 **`birthPlace` 单点**（默认 `01`）诞生；基底场由 `hash(world.name : birthPlace : substrate)` 初始化；`cellBoundary` 由 `hash(dna : id : cell)` 分配——**与地点无关，只与 DNA 有关**。

**提议（GAP-ENV）**：扩展 `birthPlace` 为 **区带 + 局域格**（仍不用经纬度地名）：

```
birthPlace = "{band}-{patch}"
  band  = E | M | P     （赤道带 / 中带 / 极带 的操作性代号，UI 可比作「赤道/温带/极地」）
  patch = 00–99         （同带内局域格，可共享或独立场态）
```

- 诞生仪式：从**该格当前基底快照**采样，给寄存器微弱初值偏置（个体「生在当前环境里」）
- `cellBoundary` 仍由 DNA 决定；**同一 DNA 不同 band** → 不同场压初条件 → 可观察存活差异
- 多体田野：不同 being 可赋不同 `patch`，同 patch 内共享局部 `e`（为 GAP-ORG「叶片」打基础）

### 6.3 时间周期：日月与四季的简化映射

用 **世界时钟** 三个正交相位（均可从 `tick` 确定性导出，便于复现）：

| 相位 | 周期（提议） | 地球类比 | 数字表现 | 日志（提议） |
|------|--------------|----------|----------|--------------|
| **日相** `diurnal` | `T_day = 240` tick | 自转 → 日夜 | 调制 **注能通道** `e☉` 的 AMB 注入幅值：`solar = max(0, sin(2π·tick/T_day))` | `[DLC] phase solar` |
| **季相** `seasonal` | `T_year = 4×T_day` | 公转 → 四季 | 慢变 `substrateFloor`、`substrateBoost`、`pulseInterval` | `[SCL] phase band floor boost` |
| **月相** `lunar` | `T_moon = 28` tick（≠日相整数倍） | 月球 → 潮汐 | 微弱调制 **节点再生率** 或 `e◐` 通道（潮汐类比） | `[LTC] phase tide` |

**不叫「太阳/月亮/春夏秋冬」**——只记相位标量与场参变化事实。

#### 日相（日夜）

```
solarInput = solar × substrateBoost_diurnal
  → 注入 e☉（如 e2）或作为 Synth-A（GAP-ORG）的乘子
night: solar ≈ 0 → 储备池个体存活 ↓；直接 DRW 者压力 ↑
```

连接内共生路线：**有 reservoir 的个体** 在夜间靠 `[RSV] out` 维持；**无储备** 者体现「夜間胁迫」。

#### 季相（四季简化）

四相 `seasonPhase ∈ {0,1,2,3}`，各 1/4 年：

| 相 | 数字参数倾向 | 地球类比（仅 UI） |
|----|--------------|-------------------|
| 0 | floor↑ boost↑ | 暖季 |
| 1 | floor→ boost→ | 过渡 |
| 2 | floor↓ drain↑ | 冷季 |
| 3 | floor→ pulse↓ | 复苏 |

#### 月相（次要）

- 振幅小（如 ±0.02），避免盖过日相/季相
- 主要影响 `nodes` 再生与 `[DEP]` 频率 — **潮汐式资源脉动**

### 6.4 空间 × 时间：赤道到两极

**区带静态梯度**（不随季相变 lat，季相只调幅值）：

| band | substrateFloor | substrateDrainMult | 日相 solar 峰值 | 类比 |
|------|----------------|--------------------|-----------------|------|
| E | 高 | 低 | 高 | 赤道：富足、热、昼夜差小* |
| M | 中 | 中 | 中 | 温带 |
| P | 低 | 高 | 低 | 极地：耗竭快、冬季长* |

\* 昼夜差：通过 `diurnal` 振幅按 band 缩放实现（赤道 day≈night 幅差小；极地夏季长昼用 asymmetry 可选）

**公式示意**：

```
effectiveFloor = bandFloor[place.band] × seasonalMod(seasonPhase)
effectiveSolar = solar(diurnal) × bandSolar[place.band] × seasonalSolarMod(seasonPhase)
```

### 6.5 与现有机制的关系

```
         [DLC] 日相 ──→ e☉ 注入 ──→ Synth-A → reservoir（GAP-ORG）
              ↓
         [DRW] 直接摄取 ←── 基底 e0–e7 ←── [SCL] 季相调 floor/boost
              ↑
         [LTC] 月相 ──→ 节点再生 / e◐
              ↑
         band 区带（E/M/P）静态梯度
              ↑
         birthPlace 诞生采样 → 个体初条件
```

- `[SHK]`/`[NPL]` **保留**为剧变脉冲，与季相独立（类似极端天气 ≠ 季节）
- `[BIO]` 种群反馈仍作用于**局域 patch** 的基底

### 6.6 最小可交付路径（建议 Phase 85+）

1. **place band**：`birthPlace` 解析 `E|M|P` + patch；band 静态参数
2. **日相 `[DLC]`**：`T_day=240`，调制 e☉ 注入；田野日/夜存活对比
3. **季相 `[SCL]`**：`T_year=960`，四相调 floor/boost
4. **月相 `[LTC]`**：节点潮汐；可选
5. 与 **GAP-ORG** 汇合：日相 × Synth-A × reservoir 夜間生存

每步 on/off 田野；**不立项「温度」「季节」CODEX 条**，先观察相位–场参–END 率关系。

---

## 七、文档索引

| 文档 | 角色 |
|------|------|
| [WISDOM.md](WISDOM.md) | 智慧北极星 + W1–W5 |
| [GAPS.md](GAPS.md) | 缺口登记 |
| [ENVIRONMENT.md](ENVIRONMENT.md) | 基底场与 DRW |
| [PHASE35_MULTICELL.md](PHASE35_MULTICELL.md) | 多细胞 / subCell 分工 |
| [PHASE82_WISDOM_ACCEPTANCE.md](PHASE82_WISDOM_ACCEPTANCE.md) | 物种验收 prepared |
| [PHASE83_L2_CODEX_CLOSURE.md](PHASE83_L2_CODEX_CLOSURE.md) | L2 上限接受 |

---

*基底先观察通量，再谈本体；内共生先可记录，再谈联合体。*
