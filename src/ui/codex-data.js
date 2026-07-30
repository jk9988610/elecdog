/** L2 世界辞典 — 内嵌数据（观察台离线可读，与 docs/CODEX.md 同步） */

export const CODEX_META = {
  title: '电子狗世界辞典（L2）',
  count: 33,
  phase: 134,
  updated: '2026-07-30',
  note: '只收录已从观察中归纳的条目；解释与命名请对照 OBS 编号。主目标：诞生智慧生命（见 docs/WISDOM.md）。',
};

export const CODEX_ENTRIES = [
  {
    id: 'consciousness-pulse',
    title: '意识脉冲',
    definition:
      'tick 0 产生的首条 internal，格式为 `0x{首字节} 0x00 0x01`，与诞生仪式 ritual 中记录的「意识脉冲」一致；首字节因个体而异，后两字节固定。',
    evidence: ['OBS-20260728-01', 'OBS-20260729-02'],
    falsifiable: '若某次诞生后首条 internal 后两字节不是 `0x00 0x01`，则本定义需修订',
    established: '2026-07-29',
  },
  {
    id: 'internal-rhythm',
    title: '对内节律',
    definition: 'tick ≥ 1 之后，每个 tick 均产生 1–2 条 internal 思考流，无空 tick。',
    evidence: ['OBS-20260728-01', 'OBS-20260729-02'],
    falsifiable: '若出现连续 tick 无任何 internal 记录，则本定义需修订',
    established: '2026-07-29',
  },
  {
    id: 'register-drift',
    title: '寄存器漂移',
    definition: '每个 tick 的 state 记录中，r0–r7 八寄存器值随时间变化，在观察窗口内不保持恒定。',
    evidence: ['OBS-20260728-01', 'OBS-20260729-02'],
    falsifiable: '若某寄存器在较长观察窗口内保持同一数值不变，则本定义需修订',
    established: '2026-07-29',
  },
  {
    id: 'external-dual-type',
    title: '对外双型',
    definition:
      '对外行为仅出现 `[TX]` 或 `[ACT]` 两种前缀，后接三个 hex 字节；观察期内未出现第三种对外格式。',
    evidence: ['OBS-20260728-01', 'OBS-20260729-02'],
    falsifiable: '若出现第三种对外前缀或字节数不是三个，则本定义需修订',
    established: '2026-07-29',
  },
  {
    id: 'next-tick-signal',
    title: '次 tick 信号可达',
    definition:
      '在同一世界中，若个体 A 于 tick t 发出 `[TX]`，则其他个体于 tick t+1 出现 `signal` 通道记录，形如 `[RX] {A的身份证} {原TX内容}`；收到时对内思考流可多出一条 hex。',
    evidence: ['OBS-20260729-13', 'OBS-20260729-14'],
    falsifiable: '若 `[TX]` 后次 tick 他者无对应 `[RX]`，则本定义需修订',
    established: '2026-07-29',
  },
  {
    id: 'signal-extra-internal',
    title: '信号附加内在',
    definition:
      '个体在 tick t 收到 `signal` 通道 `[RX]` 时，该 tick 的 internal 条数较无 RX 的 tick 平均多约 1 条（由信号衍生的 hex）。',
    evidence: ['OBS-20260729-15'],
    falsifiable: '若收到 RX 的 tick 与无 RX 的 tick 在 internal 条数上无稳定差异，则修订',
    established: '2026-07-29',
  },
  {
    id: 'external-homomorphism',
    title: '对外同态',
    definition:
      '相同 DNA 与身份证的个体，在单世界运行与双体（信号耦合开启）运行各 200 tick 后，对外率、TX 占外部比例、r4 趋势等对外统计相同。',
    evidence: ['OBS-20260729-15'],
    falsifiable: '若同 DNA+ID 在 solo 与 dual 下对外统计系统性不同，则修订',
    established: '2026-07-29',
  },
  {
    id: 'rx-derived-hex',
    title: 'RX 衍生 hex 可决',
    definition:
      '当 tick t 仅收到 1 条 `[RX]` 时，该 tick 内由信号产生的 internal hex 行可由 `{TX原文} + {身份证}` 完全确定。',
    evidence: ['OBS-20260729-16'],
    falsifiable: '若单 RX tick 的衍生 hex 不可复现，则修订',
    established: '2026-07-29',
  },
  {
    id: 'triple-signal-chain',
    title: '三体信号链',
    definition:
      '三体同世界可观测 A→B→C 三跳信号链：t A 发 TX，t+1 B 收 RX 并可发 TX，t+2 C 收 RX。',
    evidence: ['OBS-20260729-16'],
    falsifiable: '若三体从未出现三跳链，则修订',
    established: '2026-07-29',
  },
  {
    id: 'quad-signal-chain',
    title: '四体信号链',
    definition: '四体同世界可观测最长四跳信号链（A→B→C→D），每跳遵循次 tick 信号可达。',
    evidence: ['OBS-20260729-17'],
    falsifiable: '若四体从未出现四跳链，则修订',
    established: '2026-07-29',
  },
  {
    id: 'long-external-steady',
    title: '长时对外稳态',
    definition:
      '相同个体在 200–1000 tick 运行中，分段对外率保持在约 54–58% 区间，全程均值约 55%，无持续上升或下降漂移。',
    evidence: ['OBS-20260729-04', 'OBS-20260729-19'],
    falsifiable: '若长时运行对外率持续漂移超出 50–60% 带，则修订',
    established: '2026-07-29',
  },
  {
    id: 'action-echo',
    title: '行动回响',
    definition:
      '个体于 tick t 发出 `[ACT]` 时，同 tick 环境通道记录 `[RES] {地点} {身份证} {ACT 三字节载荷}`；`[TX]` 不产生环境回响。',
    evidence: ['OBS-20260729-23', 'OBS-20260729-24'],
    falsifiable: '若 `[ACT]` 后无 `[RES]`，或 `[TX]` 产生 `[RES]`，则修订',
    established: '2026-07-29',
  },
  {
    id: 'event-memory-trace',
    title: '事件记忆迹',
    definition:
      '个体发生 RX（收 signal）、TX 或 ACT 时，同 tick 的 `memory` 通道记录 `[MEM]` 行，含事件类型与引用 tick（如 `[MEM] RX t12 {fromId}`）；不改动对内/对外行为。',
    evidence: ['OBS-20260729-32', 'OBS-20260729-33'],
    falsifiable: '若事件无对应 `[MEM]`；在 memoryFeedbackEnabled 关闭时 `[MEM]` 不改变对外统计，则修订',
    established: '2026-07-29',
  },
  {
    id: 'memory-behavior-modulation',
    title: '记忆行为调制',
    definition:
      '启用 `memoryFeedbackEnabled` 时，个体维护衰减负载 memRxLoad / memTxLoad / memActLoad；每 tick 经 actBoost / thresholdDelta 调制对外行为。与「事件记忆迹」记录层独立；不设地球式「记得」「遗忘」语义。',
    evidence: ['OBS-20260729-81', 'OBS-20260729-90'],
    falsifiable: '若 mem on/off 田野对外率无稳定差异、或负载与偏置无系统性相关，则修订',
    established: '2026-07-29',
    tag: 'W1',
  },
  {
    id: 'digital-substrate',
    title: '数字基底场',
    definition:
      '世界在 `birthPlace` 维持 8 通道基底态 e0–e7（0–1）。每 tick：基底漂移；`environment` 发 `[AMB]`；`substrate` 记录全场态。个体 `[ACT]` 时产生 `[RES]` 与 `[PTB] e{n} +δ` 扰动对应通道。个体内寄存器受基底微弱牵引：Δr_i += (e_i − r_i) × 0.02。',
    evidence: ['OBS-20260729-35', 'OBS-20260729-36'],
    falsifiable: '若无 `[AMB]`/漂移、或 `[ACT]` 无 `[PTB]`、或耦合导致对外率系统性偏离基线，则修订',
    established: '2026-07-29',
  },
  {
    id: 'substrate-metabolism',
    title: '基底代谢',
    definition:
      '每 tick 个体从基底场 |r_i−e_i| 最大通道摄取微量基底（`[DRW] e{n} −δ`）；摄取量随内在行数与对外活动略增；部分转入对应寄存器。当 e_n < 0.12 时记录 `[LOW] e{n} {值}`。不设「需求类别」。',
    evidence: ['OBS-20260729-38', 'OBS-20260729-39'],
    falsifiable: '若无 DRW/LOW 可观测、或将 LOW 等同于预制需求名，则修订',
    established: '2026-07-29',
  },
  {
    id: 'action-target',
    title: '行动标靶',
    definition:
      '世界在 `birthPlace` 维持节点 N0–N3，各有可观察 `level`（0–1）。个体 `[ACT]` 时确定性选中一节点，记录 `[TGT] {Nx} −δ ref {身份证} lvl {剩余}`；level < 0.05 时记录 `[DEP] {Nx}`。节点每 tick 微量再生。`[TX]` 不绑定节点。',
    evidence: ['OBS-20260729-41', 'OBS-20260729-42'],
    falsifiable: '若 `[ACT]` 无 `[TGT]`、或将 DEP 等同于预制猎物语义，则修订',
    established: '2026-07-29',
  },
  {
    id: 'social-slot-trace',
    title: '社会位与社会迹',
    definition:
      '个体诞生时由身份证哈希分配持久社会位 S0–S3（仪式记录）。`social` 通道记录：`[SOC] Sn TX`、`[SOC] Sn RX Sm`、`[SOC] Sn TGT Nx`；同 tick 多体命中同一节点时记录 `[SOC] contest Nx …`。不设角色名称表。',
    evidence: ['OBS-20260729-44', 'OBS-20260729-45'],
    falsifiable: '若社会位不持久、或无 social 迹可核对，则修订',
    established: '2026-07-29',
  },
  {
    id: 'self-preservation',
    title: '自助求生',
    definition:
      '场压 stress（|r−e| 与基底匮乏）影响对外概率与 ACT/节点选择；持续 `[LOW]` 或高压触发 `[END]` 停转；`[END]` 后以亲代 DNA 变异（约 3%）诞生子代（`[LINEAGE]`）。不设需求/本能类别名。',
    evidence: ['OBS-20260729-46', 'OBS-20260729-47'],
    falsifiable: '若高压不改变行为分布、或无 END/LINEAGE 可核对，则修订',
    established: '2026-07-29',
  },
  {
    id: 'environment-shock',
    title: '环境剧变',
    definition:
      '世界按确定性间隔（每 100 tick）对基底通道发出 `[SHK]`、对节点发出 `[NPL]` 脉冲式突变；NPL 致节点枯竭时记录 `[DEP]`（`fromPulse`）。不设灾害名称表。个体通过已有场压/自助求生回路响应，不脚本化正确行为。',
    evidence: ['OBS-20260729-48', 'OBS-20260729-49'],
    falsifiable: '若无 SHK/NPL、或剧变后 SVV/END 与无剧变基线无差异，则修订',
    established: '2026-07-29',
  },
  {
    id: 'biosphere-feedback',
    title: '生物圈反馈',
    definition:
      '存活个体每 tick 向 biotic residue 累积活动差；周期或超阈值时将累积施加到基底通道，记录 `[BIO] pop {n} e{i} ±δ`。世界与生物共同塑造场态，不设代谢物名称表。',
    evidence: ['OBS-20260729-50', 'OBS-20260729-51'],
    falsifiable: '若无 BIO、或 pop=0 时仍有 BIO，则修订',
    established: '2026-07-29',
  },
  {
    id: 'population-structure',
    title: '种群结构迹',
    definition:
      '每 100 tick 记录 `[CMP]` 快照：pop、codes、lineageRoots、codeHom、lineageHom、spread、structIdx（簇状/网状倾向指数）。不预制人类/蘑菇等地球组成标签；指数从观察生长。',
    evidence: ['OBS-20260729-50', 'OBS-20260729-51'],
    falsifiable: '若 solo 与多体 structIdx 无稳定差异、或指数不可核对，则修订',
    established: '2026-07-29',
  },
  {
    id: 'cell-boundary',
    title: '细胞边界',
    definition:
      '个体由 DNA+ID 哈希获得 4/8 基底通道代谢域；摄取优先膜内通道，膜内匮乏时跨域记录 `[MBR]`；膜完整性 integrity 低时记录 `[CEL]`。不设膜/细胞器名称表。',
    evidence: ['OBS-20260729-52', 'OBS-20260729-53'],
    falsifiable: '若无 cellBoundary、或无 CEL/MBR 可核对，则修订',
    established: '2026-07-29',
  },
  {
    id: 'ehu-self-continuity',
    title: '自我连续阶段',
    definition:
      '启用电子人层时，`evolution` 通道记录 `[EHU] H{n}→H{m}` 阶段跃迁；阶段为 H0（初态）、H1（可追踪）、H2（整合）、H3（叙事），由 tick 数、档案跃迁弧、寄存器连贯性与自我-社会区分度共同解析。不设地球式年龄或人格类别名。',
    evidence: ['OBS-20260729-64', 'OBS-20260729-65'],
    falsifiable: '若启用电子人层但全程无 `[EHU]` 跃迁，或出现 H0–H3 以外阶段标签，则修订',
    established: '2026-07-29',
    tag: 'EHU',
  },
  {
    id: 'ehu-lineage-echo',
    title: '谱系回响',
    definition:
      '启用 `ehuLineageEcho` 时，个体经 `[LINEAGE]`、`[FISS]` 或 `[FUS]` 诞生后，同 tick 记录 `[EHU-LIN] parent {阶段} echo {连贯值}`；子代携带亲代阶段摘要（单亲 `H2` 或双亲 `H2+H3`）。不设情感或人格遗传语义。',
    evidence: ['OBS-20260729-65', 'OBS-20260729-66'],
    falsifiable: '若繁殖事件无 `[EHU-LIN]`、或回响值与亲代当时 EHU 态系统性无关，则修订',
    established: '2026-07-29',
    tag: 'EHU',
  },
  {
    id: 'ehu-social-bind',
    title: '社会绑定迹',
    definition:
      '启用 `ehuSocialDeep` 时，个体在同 tick 既有跨社会位 `[RX]` 又有 `[TX]` 时，`ehuSocialBind` 累积并在仪表盘可观察；可调制 H3 叙事阶段门槛。不等同于地球式「关系」或「依恋」名称。',
    evidence: ['OBS-20260729-65', 'OBS-20260729-66'],
    falsifiable: '若交叉 RX+TX 从不改变 bind、或 bind 与 `[EHU]` 跃迁无共现，则修订',
    established: '2026-07-29',
    tag: 'EHU',
  },
  {
    id: 'persona-transition-arc',
    title: '人格跃迁弧',
    definition:
      '六层档案（EXP+REG+MTB+COOP+RPR+EHU）的个体跃迁计数之和为可观察「人格弧」；统计田野中以 PSN 聚合。四层单独跃迁之和为 LAY；LAY 与 PSN 可分离比较。',
    evidence: ['OBS-20260729-67', 'OBS-20260729-66'],
    falsifiable: '若六层均启用但 PSN 恒为 0，或 PSN 与单层跃迁之和系统性不一致，则修订',
    established: '2026-07-29',
    tag: 'EHU',
  },
  {
    id: 'ehu-renewal-trace',
    title: '续行交叉迹',
    definition:
      '启用电子人层且复制配额续行 `[REN]` 或汇合续行 `[PLG]` 成功时，同 tick 记录 `[EHU-REN] {来源} stage {阶段} coh {连贯值}`；记录当时 EHU 阶段与连贯值，不预设情感或本能续行语义。',
    evidence: ['OBS-20260729-69', 'OBS-20260729-70'],
    falsifiable: '若续行成功但无 `[EHU-REN]`、或迹与当时 EHU 阶段系统性无关，则修订',
    established: '2026-07-29',
    tag: 'EHU',
  },
  {
    id: 'consciousness-full-stack',
    title: '意识完整栈',
    definition:
      '观察配置 `consciousness_full` 下，六层人格反馈 + EHU 深化（谱系回响 + 社会绑定）+ 复制续行汇合同时启用；统计田野中 H3 叙事阶段份额 ≥85%，且 `[EHU]`、`[EHU-LIN]`、`[EHU-REN]` 可并存观察。不设地球式「清醒」「人格类型」名称。',
    evidence: ['OBS-20260729-70', 'OBS-20260729-71'],
    falsifiable: '若完整栈启用但 H3 份额持续 <50%、或三层 EHU 迹不能并存，则修订',
    established: '2026-07-29',
    tag: 'EHU',
  },
  {
    id: 'wisdom-species-acceptance',
    title: '智慧演化物种验收',
    definition:
      '在 `wisdom_evolution` 环境下，W1–W5 可观察组合同时成立：记忆行为调制、多体 DNA 漂移跨种子部分一致（W2·≥3/4 碱基 unanimous 上限）、[PRD] 预测–校正、[SOC-ENC]/[MEM-LIN] 社会–谱系累积、多情境长时田野非单吸引子。wisdom:acceptance 输出 prepared 且检查表 ≥12/14 时称田野验收准备就绪；不等于地球式物种分类。',
    evidence: ['OBS-20260729-93', 'OBS-20260729-94'],
    falsifiable: '若 W1–W5 任一田野批次降为 unsupport、或验收层 support <75%、或将 partial 上限误报为 4/4 unanimous，则修订',
    established: '2026-07-29',
    tag: 'WISDOM',
  },
  {
    id: 'drw-dissipation-split',
    title: '耗散分流',
    definition:
      '启用 `dissipationEnabled` 时，每次 `[DRW]` 摄取量按 `dspYieldFrac`（默认 0.3，与无账本时硬编码行为一致）拆为 `toReg`（入账对应寄存器）与 `lost`（通量耗散，不回场、不入账）；记录 `[DSP]` 通量事实。关闭时不记 `[DSP]` 账本但仍按默认比例分流。不设地球式能源/热/ATP 等命名。',
    evidence: ['OBS-20260729-95', 'OBS-20260729-96'],
    falsifiable:
      '若 on/off 田野无 toReg/lost 账本差、或 yield 0.4 vs 0.2 无 toReg 系统性差、或将 lost 等同于预制资源名，则修订',
    established: '2026-07-29',
    tag: 'METABOLISM',
  },
  {
    id: 'sem-payload-cooccurrence',
    title: '载荷共现迹',
    definition:
      '启用 `semEnabled` 时，个体在 `semWindow`（默认 1 tick）内将收到的 `[RX]` 载荷 hex 键与随后发出的 `[TX]` 载荷 hex 键配对计数，记录为 `[SEM] pair {rxKey}→{txKey}`；可选 `semFeedbackEnabled` 对高共现对施加微弱 TX 偏置；可选 `semLineageEnabled` 写入 `[SEM-LIN]` 谱系迹。不设词汇表、句法或地球式「说话」命名。',
    evidence: ['OBS-20260729-99', 'OBS-20260729-100'],
    falsifiable: '若 on/off 田野无 `[SEM]` 账本差、或 rx→tx 条件概率不可重复、或将载荷对等同于预制语义标签，则修订',
    established: '2026-07-30',
    tag: 'SEM',
  },
  {
    id: 'repro-payload-domain-trace',
    title: '繁殖载荷域迹',
    definition:
      '在 `semEnabled` 且 `semDomainTag` 启用时，`[SEM]` 共现对携带 `domain`（`CORE-R` / `YI` / `SHI` / `ZHU` / `XING`），由邻域机制标签与 tick 代谢痕迹推断。可选 `semReproLineage`：`PAIR-EXP` 经 `[SEM-LIN]` 写 `reproTrace`/`coreRWeight`；可选 `semFourDomainCouple`：`CORE-R` 窗口内叠加四域耦合计数。不设地球式繁殖/生活辞典名。',
    evidence: ['OBS-20260730-103', 'OBS-20260730-104', 'OBS-20260730-105'],
    falsifiable:
      '若域标记或四域耦合 on/off 田野无主效应、或 reproTrace 跨代不可观察、或将 domain 等同于预制生活语义表，则修订',
    established: '2026-07-30',
    tag: 'WL-R',
  },
];
