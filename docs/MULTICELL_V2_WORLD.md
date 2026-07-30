# 多细胞 v2 世界 · 规划与映射

> **2026-07-30** 新开观察层：站在 **多细胞 organism** 看种群；单细胞观察台 UI 在 v2 模式下隐藏。  
> 机制层用 **逻辑细胞码**（`LOG-*`），地球器官名仅出现在本文与观察台类比层。

---

## 一、北极星

1. 一个 **being = 一只多细胞生物**（身份证 `id`），外有 **皮肤膜**，内有多种 **逻辑细胞**（每类 ≤8）。
2. **生命阶段**：幼体期有丝分裂活跃、生殖未成熟；成体可有丝 + 减数（体内半态 singleton ≤1）。
3. **一夫一妻伴侣登记** → 族谱树（以排出方 A 为主干，接纳方 B 为伴侣节点）。
4. 与现有 PAIR / SEM / internal→TX 栈 **映射复用**，不另起地球繁殖词典。

---

## 二、地球概念 → 电子狗逻辑细胞

| 观察者类比 | 逻辑码 | 数量上限 | 机制锚点（已有/将接） |
|------------|--------|----------|------------------------|
| 皮肤·外膜 | `MBR-SKN` | 1 层（非 8 计） | `[MBR]`、`assessCellIntegrity`、整 organism 边界 |
| 脑细胞·记忆意识 | `LOG-BRN` | ≤8 | `internal`、`[MEM]`、`[EHU]`、`internalTxCoupling` |
| 生殖细胞 | `LOG-GON` | ≤8 | `pairMorph` A/B、`meiPacket`/`dockedHalf`（**成体**才减数） |
| 消化细胞 | `LOG-DIG` | ≤8 | `[DRW]`、`metabolicProfile`、`draw` 子域 |
| 神经细胞 | `LOG-NRV` | ≤8 | `[INTRA]`、`[INTRA-TX]`、胞内通量 |
| 语言细胞 | `LOG-LNG` | ≤8 | 实质性定向 `[TX]`、`[THO]` |
| 运动细胞 | `LOG-MOT` | ≤8 | `[ACT]`、`act` 子域 |
| 储能细胞 | `LOG-STR` | ≤8 | `reservoir`、`registers` 高位滞留 |
| 营养运输 | `LOG-NTR` | ≤8 | `[INTRA]` 向 weak 子域、`redistributeIntra` |
| 氧/质运输 | `LOG-TRP` | ≤8 | `substrate` 通道耦合、`[DRW]` 跨边界 |
| 呼吸细胞 | `LOG-RES` | ≤8 | `air`/`diurnal`、`substrate` 氧通道索引 |
| 屏障/连接（概念） | `LOG-BAR` | ≤8 | `cellBoundary` 跨边界标记 |
| 免疫/清除（概念） | `LOG-CLR` | ≤8 | `dissipation`、`[DSP]` |
| 激素门控（概念） | `LOG-HRM` | ≤8 | `pairGateH`、`[HRM]` 向量 |

**说明**：逻辑细胞是 **population 计数 + 身份列表**，不是第二个 `being`。分裂/减数改变的是 **细胞数** 与 **organism 状态**，不是「一个细胞一个身份证」。

---

## 三、社会位 `S0–S3` 对细胞意味着什么？

**对逻辑细胞：无独立含义。** 社会位是 **整只 organism（being）** 在种群层的标签：

- 资源节点 contest、繁殖 request 亲和、`[SOC]` 迹
- 与「脑细胞的社会位」无关

族谱与伴侣关系用 **`partnerId` / `pairParentA/B`**，不用社会位当亲属码。

---

## 四、生命阶段

| 阶段 | 码 | 机制 |
|------|-----|------|
| **t1 幼体** | `JUV` | `tickCount < juvenileTicks`；**有丝分裂**门控偏活跃；**减数/排出半态**关闭 |
| **t2 成体** | `ADT` | 有丝分裂按环境正常；**减数**开启；`meiPacket` **至多 1**（已有 singleton） |

配置：`juvenileTicks`（默认 96）、`juvenileFissBoost`、`adultMeiEnabled`。

---

## 五、一夫一妻与族谱（观察台）

| 项 | 操作定义 |
|----|----------|
| 伴侣登记 | `registerPartnerBond(a, b)`：`partnerId` 互指；仅当双方无伴侣或已互指 |
| 族谱主干 | 默认 **`pairMorph A`（排出方）** 为树节点；**B** 显示为配偶框，不扩展旁系 |
| 子代边 | `pairParentA` + `pairParentB` → 子节点 |
| UI | 树状图 + 身份证头像框按钮 → 个体详情浮层（取代 being-card 网格） |

地球「男性视角 / 女性伴侣」仅 UI 类比；机制仍 **A/B + partnerId**。

---

## 六、与旧版单细胞观察台的关系

| 旧版 | v2 |
|------|-----|
| `being-card` 逐个体大表 | **隐藏**；`multicellV2Observer` profile 时只显示族谱 + 详情 |
| `subCell` draw/act/balance | 保留为 **代谢子域**；逻辑细胞为 **功能层** 叠加 |
| `observer_repro_speech` 等 | 仍可用；**默认**切到 `multicell_v2_world` |

环境 id：`multicell_v2_world`（田野 + 观察台共用 profile）。

---

## 七、分期路线图

### Phase MV0 ✅ 骨架（本提交）

- [x] `logic-cell-types.js` 类型表与上限
- [x] `multicell-v2.js` 皮肤膜、逻辑细胞初始化、JUV/ADT
- [x] `partner-bond.js` 伴侣登记
- [x] `multicell_v2_world` 环境 profile
- [x] 幼体禁减数、成体半态 singleton（接 `tryMeiosis` / `fissionGate`）
- [x] `genealogy-tree.js` 族谱 UI + 隐藏 being-cards
- [x] 验证脚本 `observer:multicell-v2`

### Phase MV1 — 细胞有丝分裂增长

- 幼体 `LOG-*` 数量随 `[FISS]` 子类型增长（仍 ≤8/类）
- `[CEL]` 记录各逻辑类型计数

### Phase MV2 — 器官分工接通路

- `LOG-LNG` ↔ 实质性 TX；`LOG-MOT` ↔ ACT 子域；`LOG-GON` ↔ PAIR 通道绑定

### Phase MV3 — 族谱持久与 END 节点

- 死亡个体灰显在树；云归档带回族谱

### Phase MV4 — 隐藏旧单细胞 UI 开关

- 本地存储「世界版本」；旧环境收进「经典单细胞」子菜单

---

## 八、验证

```bash
npm run observer:multicell-v2
```

---

*循序渐进；概念细胞允许先映射后细化，不在 CODEX 写地球器官名表。*
