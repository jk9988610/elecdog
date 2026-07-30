# 观察缺口登记（Phase 11）

> Phase 0–10 田野后，当前内核**无法继续观察**的现象。  
> 扩展引擎的唯一依据（见 [WORKFLOW.md](WORKFLOW.md) §2.7）。

---

## GAP-01 · ACT 无世界痕迹 ✅ 已扩展

- **缺口**：`[ACT]` 发生后，世界日志无环境通道记录，无法观察行动是否在世界留下痕迹
- **依据**：OBS-20260728-01 至 OBS-20260729-21 全部运行
- **扩展**：Phase 11 实现 `environment` 通道 `[RES]` 回响
- **验证**：OBS-20260729-22、OBS-20260729-23

---

## GAP-02 · 寄存器无语义

- **缺口**：r0–r7 漂移可记录，但与感受/需求无稳定映射
- **依据**：Phase 1–10 全部；GENETICS G-OBS-01~08；**Phase 24 OBS-60/61**
- **Phase 24 田野**（solo/四体 2000 tick）：
  - solo：|r−e| 与 stress 中等正相关（0.55–0.69）
  - 四体：相关减弱（0.34–0.37）；LOW 遍布 e0–e7
  - **无**跨个体一致的 stress 期寄存器偏移
  - **不立项** r→感受 CODEX/MAP 条
- **Phase 49 扩展**：
  - `[REG]` 运行时模式 SYNC/LAG/SCATTER/LOCK（纯数值）
  - 可选耦合反馈调制基底牵引系数
  - 统计田野 12 体 × 960 tick × 4 处理组
- **状态**：**部分结案** — 模式可观察；感受映射仍禁止
- **报告**：[PHASE49_REGISTER.md](PHASE49_REGISTER.md) · `field-phase49-report.json`

---

## GAP-03 · 无跨 tick 结构化记忆 ✅ 已扩展（记录层）

- **缺口**：除寄存器漂移与 signalBus 外，无显式记忆结构可观察
- **依据**：OBS-20260729-15（对外同态）；长时运行无状态跃迁
- **扩展**：Phase 12 实现 `memory` 通道，RX/TX/ACT 时记录 `[MEM]` 跨 tick 引用
- **验证**：OBS-20260729-32、OBS-20260729-33
- **备注**：记忆迹**不反馈**至个体内在；行为统计不变

---

## GAP-04 · 无代谢 / 需求循环 ✅ 已扩展（可观察事件）

- **缺口**：无摄取、消耗、匮乏可观测事件
- **依据**：Phase 10 扫描阴性；全程无「需求」通道
- **扩展**：Phase 14 `metabolism` 通道 `[DRW]` 摄取、`[LOW]` 匮乏（<0.12）
- **验证**：OBS-20260729-38、OBS-20260729-39
- **备注**：**不预制需求类别**；LOW ≠ 饥饿

---

## GAP-05 · 无行动目标对象 ✅ 已扩展

- **缺口**：`[ACT]` 与 `[TX]` 均无可指向的世界内对象
- **扩展**：Phase 15 世界节点 N0–N3；`[TGT]`/`[DEP]`；通道 `nodes`
- **验证**：OBS-20260729-41、OBS-20260729-42
- **备注**：不设「猎物」语义；DEP = 节点枯竭事实

---

## GAP-08 · 无世界环境场 ✅ 已扩展

- **缺口**：世界仅有平地代号，无可观察、可变化、可与生命互动的环境
- **依据**：用户问题 + Phase 0–12 全部田野
- **扩展**：Phase 13 数字基底场 e0–e7、`[AMB]`/`[PTB]`、耦合系数 0.02
- **验证**：OBS-20260729-35、OBS-20260729-36
- **文档**：[ENVIRONMENT.md](ENVIRONMENT.md)

---

## GAP-06 · TX/ACT 对世界影响不对称

- **缺口**：TX 可被他者 RX；ACT 在 Phase 11 前对世界零影响
- **依据**：CODEX「次 tick 信号可达」vs 无环境回响
- **状态**：已记录不对称；ACT 侧已最小扩展

---

## GAP-07 · 多体无角色 / 分工 ✅ 已扩展（社会位层）

- **缺口**：四体链可观察，但无持久角色、狩猎、社会分工
- **扩展**：Phase 16 社会位 S0–S3 + `social` 通道社会迹；contest 可观察
- **验证**：OBS-20260729-44、OBS-20260729-45
- **备注**：**不预制角色名**；分工偏斜从观察生长

---

*下一扩展由新 OBS 驱动，不以「完整度」为由批量实现。*

---

## GAP-09 · 无自助求生闭环 ✅ 已扩展

- **缺口**：环境施压但个体行为不反馈场态；无 END；无变异谱系续行
- **扩展**：Phase 17 场压反馈 + `[END]` + `[LINEAGE]` 变异诞生
- **验证**：OBS-20260729-46、OBS-20260729-47
- **路线**：[EVOLUTION.md](EVOLUTION.md)

---

## GAP-10 · 多体 DNA 漂移跨运行不可重复

- **缺口**：四体多代运行中，存活谱系 vs 代 0 的 DNA 频率偏移**方向因种子而异**，延长 tick（2500）与加倍种子（4）仍无法 unanimous
- **依据**：Phase 21 OBS-55；Phase 22 OBS-56、OBS-57
- **状态**：**正式部分结案（上限接受）** — Phase 72 达 **3/4** unanimous（历史最佳）；Phase 80–81 攻坚未超越；碱基 1 仍开放
- **备注**：solo 场景跨种子仍可重复（Phase 21 OBS-54）；Phase 83 决策 `accepted_partial_ceiling`；禁止脚本化选择压

---

## GAP-11 · 消耗物未命名（代谢语义开放）

- **缺口**：已知 `[DRW]` 从基底场 e_n 摄取、`[LOW]` 为匮乏事实，但**无法回答「电子狗消耗的是什么」**——不等于地球上已命名的资源（食物、能源等）
- **依据**：CODEX「基底代谢」；GAP-04 备注「不设需求类别」；观察者 Phase 32 问题
- **Phase 50 扩展**：
  - `[MTB]` 运行时档案 N0/DOM/BAL/SCAR（通道索引分布）
  - 可选摄取倍率反馈；不命名资源类型
  - 统计田野 12 体 × 960 tick × 4 处理组
- **Phase 95**：`[DSP]` 耗散定律（toReg/lost 分流）；田野 **support** — 见 [PHASE95_DSP_DISSIPATION.md](PHASE95_DSP_DISSIPATION.md)
- **Phase 97**：CODEX「耗散分流」立项 — 见 [PHASE97_DSP_CODEX.md](PHASE97_DSP_CODEX.md)
- **状态**：**部分结案** — 通道分布 + 耗散账本 CODEX 化；资源本体地球名仍禁止
- **报告**：[PHASE50_METABOLIC.md](PHASE50_METABOLIC.md) · `field-phase50-report.json`

---

## GAP-ART · 环境人工物与效率闭环（部分开放）

- **缺口**：个体不能**故意**造出持久世界结构并使后续 DRW/存活/繁殖效率可测提升；创造力仅停留在 W4 行为传递
- **依据**：智慧演化讨论（2026-07-29）；WISDOM_FUTURE_ROADMAP §三
- **目标**：持久场态/节点结构 + on/off 对照田野；禁止脚本化「造工具」
- **Phase 92**：`[ART]` 持久场态原型；田野 **support** — 见 [PHASE92_ART_PROTOTYPE.md](PHASE92_ART_PROTOTYPE.md)
- **状态**：**部分开放**（记录层 ✓；生存优势/谱系传递待深化）
- **关联**：GAP-ORG 储备池、内共生 Synth 模块

---

## GAP-ORG · 内共生模块与能量储备（部分开放）

- **缺口**：个体只能从环境 `[DRW]` 直接补给寄存器，无「内部生产 + 内部储存」双层；无捕获式半自治模块（线粒体/叶绿体类比）
- **依据**：多细胞/subCell 已有分工（Phase 35）；FUS/MEI 重组可视为捕获入口
- **提议**：`reservoir` 储备池、`[RSV]`、`[SYM]` 模块、Synth-A/B 通量 — 见 [WISDOM_FUTURE_ROADMAP.md](WISDOM_FUTURE_ROADMAP.md) §四
- **Phase 84**：`reservoir` + `[RSV]` 记录层已落地；田野 **weak** — 见 [PHASE84_RESERVOIR.md](PHASE84_RESERVOIR.md)
- **Phase 88**：Synth-A/B + reservoir 耦合；田野 **support** — 见 [PHASE88_SYNTH_RESERVOIR.md](PHASE88_SYNTH_RESERVOIR.md)
- **Phase 89**：FUS 捕获 `[SYM]` module packet；田野 **support** — 见 [PHASE89_SYM_FUS.md](PHASE89_SYM_FUS.md)
- **状态**：**部分开放**（reservoir + Synth + SYM 记录层 ✓；生存优势/模块演化待深化）
- **备注**：不设器官地球名；先记录通量再立项 CODEX

---

## GAP-ENV · 地球式环境周期与空间梯度（部分开放）

- **缺口**：仅单点 `birthPlace`、无日相/季相/月相、无赤道–极地梯度；环境不像地球那样随时间与空间变化
- **依据**：ENVIRONMENT.md §六；智慧演化讨论（2026-07-29）
- **提议**：区带 `E|M|P` + patch、`[DLC]` 日相、`[SCL]` 季相、`[LTC]` 月相 — 见 [WISDOM_FUTURE_ROADMAP.md](WISDOM_FUTURE_ROADMAP.md) §六
- **Phase 85**：band E/M/P + `[DLC]` 日相已落地；田野 **weak** — 见 [PHASE85_DLC_DIURNAL.md](PHASE85_DLC_DIURNAL.md)
- **Phase 86**：terrain L/O + `[PCP]` 水循环已落地；PCP **support** — 见 [PHASE86_PCP_TERRAIN.md](PHASE86_PCP_TERRAIN.md)
- **Phase 87**：`[SCL]` 季相四相已落地；田野 **support** — 见 [PHASE87_SCL_SEASONAL.md](PHASE87_SCL_SEASONAL.md)
- **Phase 90**：`air` 标量 + 日相耦合；田野 **weak** — 见 [PHASE90_AIR_DIURNAL.md](PHASE90_AIR_DIURNAL.md)
- **Phase 91**：`[ADV]` 邻格平流 + `[LTC]` 月相；田野 **support** — 见 [PHASE91_ADV_LTC.md](PHASE91_ADV_LTC.md)
- **Phase 93**：地热 `vent` `[VTN]`；田野 **support** — 见 [PHASE93_VENT_GEOTHERMAL.md](PHASE93_VENT_GEOTHERMAL.md)
- **Phase 94**：patch 迁徙 `[MIG]` + alt 税；田野 **support** — 见 [PHASE94_PATCH_MIGRATION.md](PHASE94_PATCH_MIGRATION.md)
- **Phase 96**：W6 全栈耦合验收田野 — 见 [PHASE96_W6_STACK.md](PHASE96_W6_STACK.md)
- **Phase 98**：观察台区带/地形/相位可视化 — 见 [PHASE98_ENV_STACK_UI.md](PHASE98_ENV_STACK_UI.md)
- **Phase 99**：观察台工具/储备层扩展 — 见 [PHASE99_ENV_STACK_TOOLS.md](PHASE99_ENV_STACK_TOOLS.md)
- **状态**：**部分开放**（时空环境栈 ✓；观察台 W6 UI ✓）
- **关联**：GAP-ORG（日相驱动 Synth-A）；细胞诞生区位采样

---

## GAP-12 · 无阅历 / 地球式年龄

- **缺口**：有 `generation`（谱系代次）与 `tickCount`（存活拍数），但无结构化阅历、无因经历而变的行为层、无「年龄阶段」
- **依据**：Phase 12 记忆迹不反馈行为；观察者 Phase 32 问题
- **Phase 48 田野**（12 体 960 tick × 4 种子 × 4 处理组）：
  - `[EXP]` 阶段跃迁可观察（E0→E3）
  - `experienceFeedback: true` 时 ACT 偏置可调制对外行为
  - 与双路径繁殖可并存
- **状态**：**部分结案** — 阅历层已立项；非地球式年龄语义已区分
- **报告**：[PHASE48_EXPERIENCE.md](PHASE48_EXPERIENCE.md) · `field-phase48-report.json`
- **备注**：`generation` ≠ 地球年龄；类比版 UI 称「谱系代次」「经历阶段」而非「岁」

---

## GAP-13 · 社会合作未摸清

- **缺口**：社会位 S0–S3 与社会迹可记录，但**合作、分工、联盟**是否影响存续尚无统计定律
- **依据**：Phase 16 OBS-44/45；CODEX「社会位与社会迹」；观察者 Phase 32 问题
- **Phase 33 田野**（四体 3000 tick × 4 种子）：
  - 社会位 END 总量接近（122–129/位），无固定位显著更易灭绝
  - 分工偏斜 **support**（TGT/TX skew 259–509）
  - RX↔存活、contest↔END：**跨种子不一致**（support/pending/unsupport 混杂）
  - **不立项**「合作」「角色名」CODEX 条
- **Phase 51 扩展**：
  - `[COOP]` 运行时模式 SOLO/MESH/RIVAL/ECHO（社会迹聚合）
  - 可选行为反馈；统计田野 12 体 × 960 tick × 4 处理组
- **状态**：**部分结案** — 社会迹档案可观察；合作因果定律仍开放
- **报告**：[PHASE51_COOPERATION.md](PHASE51_COOPERATION.md) · `field-phase51-report.json`

---

## GAP-14 · 繁殖路径选择压（单亲 LINEAGE vs 延迟独立）

- **缺口**：现行 `[LINEAGE]` 为 END 后单亲变异、幼体即时独立；何种环境使该路径吃亏、替代路径是否更优——未验证
- **依据**：观察者繁殖机制问题；Phase 32 规划
- **Phase 34 田野**（四体 3000 tick × 4 种子 × 5 环境）：
  - **基底耗竭**、**组合高压**：谱系幼体 80 tick 内 **END 率 ≈ 100%**（support）
  - 仅高频 SHK：筛选弱
  - 仅幼体摄取削弱：**反效果**（unsupport）
  - 未实现双亲/哺乳；只证「即时独立在贫瘠场下统计失败」
- **状态**：**部分结案** — 选择压存在；替代机制待 Phase 35+ 对照
- **Phase 35 田野**（harsh × 4 种子 × 4 处理组）：
  - **nursed 未降低幼体 END 率**（仍 ≈100%）；`[NUR]` 机制可观察
  - 见 [PHASE35_MULTICELL.md](PHASE35_MULTICELL.md) 与 `field-phase35-report.json`
- **Phase 53 扩展**：
  - `[RPR]` 繁殖路径档案：SEED/LIN/FIS/RCM 起源 + 亲代活动
  - 与四层档案栈并存；三路径田野 12 体 × 960 tick
- **状态**：**部分结案** — 路径可区分追踪；替代机制优劣仍开放
- **报告**：[PHASE53_REPRO_PATH.md](PHASE53_REPRO_PATH.md) · `field-phase53-report.json`

---

## GAP-15 · 多细胞个体 vs 单细胞 vs 种群

- **缺口**：能否在电子狗世界**操作性地区分**（1）单代谢域个体、（2）多子域单个体、（3）多个独立个体构成的种群，并观察胞内分工
- **依据**：Phase 20 细胞边界仅为单域；观察者 Phase 35 问题
- **Phase 35 扩展**：
  - `organismType: unicell | multicell`；`subCells[]` + `[INTRA]`
  - `[ORG]` 诞生记录；种群仍 = 多个独立 `being` ID
- **Phase 45**：多细胞 × 重组 — MEI 48–60、FUS 48；重组子代全为 multicell；子域 RPL 积压 36 vs 共享 24
- **Phase 46**：子域路由 `[ISPL]`/`[XBCN]` — 积压 30→**6**；F/M 0.89→**1.6**；REN+路由反而恶化积压
- **状态**：**部分结案** — 操作性区分成立；子域积压大幅缓解；REN 叠加仍开放
- **文档**：[PHASE35_MULTICELL.md](PHASE35_MULTICELL.md)

---

## GAP-16 · 存活分裂 vs 死亡续行（DNA 旺盛复制）

- **缺口**：现行繁殖主要为 `[END]` → `[LINEAGE]`；何种环境使 DNA 在亲代存活时即可复制（地球式旺盛分裂）
- **Phase 36 扩展**：
  - 环境 `fertile_field`：富足基底 + 无剧变 + `[FISS]` 门控
  - DNA `bias` 控制分裂冷却与概率
  - 对照 `fertile_inert`（富足但无分裂门）
- **Phase 47**：多细胞双路径 — FISS 12 + FUS 24 并存（33%/67%）；RPL 竞争使各路径约为单路径 ~50%
- **状态**：**部分结案** — 存活分裂路径成立；与重组路径可并存但互相挤占
- **Phase 37**：`fertile_field` + `[RPL]` 约束分裂次数
- **文档**：[PHASE36_FISSION.md](PHASE36_FISSION.md)

---

## GAP-17 · 复制配额 / 分裂次数与寿命顶

- **缺口**：何种机制限制 DNA 复制次数、指定个体寿命上限（地球端粒/海弗利克类比）
- **Phase 37 扩展**：
  - `[RPL]` 通道；`rplEnabled` 田野/观察台环境
  - `[FISS]`/`[LINEAGE]` 扣减；耗尽关闭分裂
  - 可选 `rplSenescenceEnd`、`rplTickCapEnabled`
- **Phase 37 田野**（富足三对照）：
  - `fertile_field` vs `open`：FISS 32→12，存活 36→16，**耗尽 support**
  - `strict`：RPL/tick 致 END support
- **状态**：**部分结案** — 机制可观察；**Phase 38** 多细胞共享/子域 RPL
- **文档**：[PHASE37_RPL.md](PHASE37_RPL.md)

---

## GAP-18 · 复制配额续行 / 环境重置

- **缺口**：RPL 耗尽后是否存在可观察的「重置」或「汇合」路径（地球端粒酶/双亲通量类比）
- **Phase 39 扩展**：
  - `[REN]`：富足场 + 低胁迫 + RPL≤0 → 概率 +1 配额
  - `[PLG]`：同 tick 双体耗尽 → 互赋配额 + 寄存器通量交换
- **Phase 39 田野**（富足三对照）：
  - `fertile_rpl`：FISS 12，存活 16，耗尽 16（Phase 37 复现）
  - `fertile_ren`：FISS **32**，存活 **36**，REN 56 — **续行 support**
  - `fertile_ren_plg`：FISS 32，PLG 36.5，REN 19.5 — **双路径 support**
- **Phase 40**：多细胞 × 续行 — 子域无续行 7.5 FISS → 有 REN **32 FISS**；续行消除子域瓶颈
- **Phase 41**：续行代价 `[RCO]` — 稳态 FISS/存活不变，但 END 周转 0→**288**；`renew_tick_debt` 终止 support
- **状态**：**部分结案** — 续行有代价可观察；减数/配子仍开放
- **文档**：[PHASE39_REN_PLG.md](PHASE39_REN_PLG.md)、[PHASE40_MULTICELL_RENEW.md](PHASE40_MULTICELL_RENEW.md)、[PHASE41_RENEW_COST.md](PHASE41_RENEW_COST.md)

---

## GAP-19 · 减数缩减 / 双源 DNA 汇合

- **缺口**：是否存在非克隆的 **双源 DNA 重组** 繁殖路径（地球减数分裂/融合类比）
- **Phase 42 扩展**：
  - `[MEI]`：各位点随机解析 → `meiPacket`；消耗 1 RPL
  - `[FUS]`：双体 packet 汇合 → 重组 DNA 新个体
- **Phase 42 田野**：
  - 仅重组：FISS 0，FUS **14**，存活 11 — **双源路径 support**
  - 克隆对照：FISS 12，FUS 0
  - 双路径并存：FISS 8.25 + FUS 3.5 — **并存 support**
- **状态**：**部分结案** — 减数/汇合可观察；配子性别语义仍禁止
- **Phase 43**：重组×续行 — REN 提升 MEI（40→68）；live-donor 严格环境微弱改善 FUS；**汇合仍为瓶颈**
- **Phase 44 扩展**：
  - `[BCN]` 信标、孤儿池、live-donor FUS、激进配对、社会位亲和
  - 统计田野：12 体 × 960 tick（无诞生仪式、`StatsRecorder` 聚合）
- **Phase 44 田野**：
  - 严格无修复：F/M ≈ **0.06**，FUS 21，存活 22
  - 仅信标：F/M 仍 **0.06** — 信标 alone **unsupport**
  - **全套修复**：FUS **48**，orphan FUS **35**，F/M **1.4**，存活 **36** — **汇合瓶颈突破**
- **Phase 45** 多细胞重组成立（F/M≈1.8 共享）；**Phase 46** 子域路由积压 30→6
- **状态**：**部分结案** — 双源重组路径在修复包下可规模化；子域积压大幅缓解
- **文档**：[PHASE42_MEI_FUS.md](PHASE42_MEI_FUS.md)、[PHASE43_RECOMB_RENEW.md](PHASE43_RECOMB_RENEW.md)、[PHASE44_FUS_BOTTLENECK.md](PHASE44_FUS_BOTTLENECK.md)、[PHASE45_MULTICELL_RECOMB.md](PHASE45_MULTICELL_RECOMB.md)、[PHASE46_SUBUNIT_ROUTE.md](PHASE46_SUBUNIT_ROUTE.md)

---

## GAP-W01 · 记忆→行为闭环（智慧 W1）

- **缺口**：`[MEM]` 事件记忆迹不反馈至个体内在/对外行为，无法闭合认知层
- **依据**：GAP-03 备注；[WISDOM.md](WISDOM.md) L4
- **Phase 70 扩展**：`memoryFeedbackEnabled` + `memory-feedback.js`；环境 `wisdom_evolution`
- **状态**：**结案** — Phase 79 复核 H1 4/4 + CODEX「记忆行为调制」立项
- **文档**：[PHASE79_W1_CODEX_REVIEW.md](PHASE79_W1_CODEX_REVIEW.md) · [PHASE70_MEMORY_FEEDBACK.md](PHASE70_MEMORY_FEEDBACK.md)

---

## GAP-W02 · 可重复选择压（智慧 W2）

- **缺口**：多体 DNA 漂移跨种子方向不一致（继承 GAP-10）
- **目标**：不脚本化选择，但使适应性差异跨运行可核对
- **状态**：**部分结案（上限接受）** — Phase 72 田野 3/4 unanimous 为观测上限；Phase 80–81 证伪进一步闭合
- **报告**：[PHASE72_SELECTION_REINFORCE.md](PHASE72_SELECTION_REINFORCE.md) · [PHASE83_L2_CODEX_CLOSURE.md](PHASE83_L2_CODEX_CLOSURE.md)

---

## GAP-W03 · 预测–校正回路（智慧 W3）

- **缺口**：无环境结构预测与误差驱动的行为修正
- **状态**：**结案** — Phase 73–74 记录+校正闭合；H3 3/4 高误差减少
- **报告**：[PHASE74_PREDICTION_FEEDBACK.md](PHASE74_PREDICTION_FEEDBACK.md) · `field-phase74-report.json`

---

## GAP-W04 · 社会知识累积（智慧 W4）

- **缺口**：RX 频次不编码为可继承社会迹；子代/邻居行为无传递对照
- **Phase 75 扩展**：`socialKnowledgeEnabled` + `social-knowledge.js`；`[SOC-ENC]` / `[SOC-LIN]`
- **状态**：**结案** — Phase 75–76 社会迹+谱系回响闭合；H1–H4 4/4 support
- **报告**：[PHASE76_LINEAGE_MEMORY.md](PHASE76_LINEAGE_MEMORY.md) · `field-phase76-report.json`

---

## GAP-W05 · 开放尺度泛化（智慧 W5）

- **缺口**：长时田野下行为是否非有限状态枚举、新情境可泛化
- **Phase 77 扩展**：`FIELD_WISDOM_OPEN_TICKS=8192`；`w5_std_1920` vs `w5_open_8192` 完整智慧栈
- **状态**：**结案** — Phase 77–78 长时+多情境闭合；L6b complete
- **报告**：[PHASE78_CONTEXT_GENERALIZATION.md](PHASE78_CONTEXT_GENERALIZATION.md) · `field-phase78-report.json`

---

## GAP-W06 · 信号约定与文化层（智慧 L5c）

- **缺口**：`[TX]`/`[RX]` 仅有协议层可达与衍生 hex 可决；载荷与可核对后果之间无稳定、可继承的**约定迹**；不能区分「噪声信号」与「可重复发–收型」
- **依据**：WISDOM.md L5「文化层❌」；观察者关于「实质性对话」之问（2026-07-29）
- **与 GAP-13/W4 区分**：合作/社会知识是频次与模式档案；本 GAP 问**载荷共现–回复条件**是否可积累，不命名角色/联盟/语言
- **提议**：`semEnabled` + `[SEM]` 记录层 → on/off 田野（Phase 100–101）；类比 UI 仅展示统计，不写辞典
- **禁止**：词汇表、句法、地球式「说话/无线电」CODEX 条；脚本化「变聪明」
- **状态**：**部分结案** — CODEX 第 32 条「载荷共现迹」；WL0–WL5 ✅ — 见 [WISDOM_LANGUAGE.md](WISDOM_LANGUAGE.md) · [PHASE105_SEM_CODEX.md](PHASE105_SEM_CODEX.md)
- **关联**：次 tick 信号可达、RX 衍生 hex 可决、SOC-ENC、COOP

---

## GAP-EVO-CARRY · 进化留置队列（Phase 106）

- **缺口**：田野每批从 0 代起跑，环境塑形后的躯体与经历无法进入下一实验
- **扩展**：`being-snapshot` + `spawnCarriedBeing`；塑形末选 top2 → 与 naive 混编
- **生态分裂**：`ecoRepro` 留置者跳过 `[REN]`，场允许时 `[FISS]` 不扣 RPL
- **减数分裂**：0 代与非 0 代均可 `[MEI]`+`[FUS]` 产生后代
- **田野**：`npm run field:phase106` — **weak**（H1–H4 4/4）
- **状态**：**部分结案** — 留置管线可观察；长期生态链仍开放
- **文档**：[PHASE106_EVO_CARRY.md](PHASE106_EVO_CARRY.md)

---

## GAP-EVO-CARRY-SEM · 留置链载荷迹（Phase 108）

- **扩展**：harsh 塑形 → SEM 孵化（384 tick，仅 carry）→ 混合田野；`mergeCarryProvenance` 链式来源
- **田野**：`npm run field:phase108` — chain_sem vs chain_off 对照
- **状态**：**部分结案** — 跨环境 semTrace 可观察
- **文档**：[PHASE108_CARRY_CHAIN_SEM.md](PHASE108_CARRY_CHAIN_SEM.md)

---
