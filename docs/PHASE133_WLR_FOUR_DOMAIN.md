# Phase 133 — WL-R3 四域×繁殖核 2×2 田野

> CORE-R 繁殖核窗口内，四域（Y/S/Z/X）SEM 耦合是否可观测、可与域标记主效应分离。

## 2×2 设计

| | `semFourDomainCouple` OFF | `semFourDomainCouple` ON |
|---|---|---|
| **`semDomainTag` ON** | `ev133_r3_on_off` | `ev133_r3_on_on` |
| **`semDomainTag` OFF** | `ev133_r3_off_off` | `ev133_r3_off_on` |

基座：六环境链 × PAIR 全栈 + WL-R2 繁殖域跨代迹（on 行）。

## 机制

- `semFourDomainCouple` — CORE-R 活跃窗口内，同时将活跃四域戳写入 `semFourDomainCoupleTally`
- `[SEM]` 日志可选 `fourDomain: [YI,SHI,…]` 数组
- 实现：`src/world/sem-domain.js` · `noteFourDomainCouple`

## 田野假说（7/7）

1. 链留置 ≥3 种子
2. 域标记主效应：domain ON > OFF（CORE-R 计数）
3. 四域耦合主效应：on_on couple > on_off
4. off_on 无耦合（无域标记则耦合无效）
5. on_on 四域耦合总量 > on_off
6. on_on 繁殖域 SEM-LIN 可观测
7. 耦合不破坏域标记（on_on CORE-R ≥ on_off × 0.85）

## 验证

```bash
npm run field:phase133
npm run field:phase133:verify
```

报告：`docs/field-phase133-report.json`
