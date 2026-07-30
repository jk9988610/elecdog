# Phase 131 — WL-R1 繁殖邻域 SEM 域标记

> 链×PAIR 全栈基座上，为 `[SEM]` 载荷共现对增加 `domain` 标记（CORE-R / YI / SHI / ZHU / XING）。

## 处理组

| ID | 说明 |
|----|------|
| `ev131_wlr_chain_full` | 六环境链 + PAIR 全栈 + SEM 域标记 |
| `ev131_wlr_chain_pair0` | 六环境链 + PAIR-0 + SEM 域标记（对照） |
| `ev131_wlr_sem_plain` | 六环境链 + PAIR 全栈 + SEM 无域标记（对照） |

## 机制

- `src/world/sem-domain.js` — 事件 kind → 域；tick 内代谢/行为痕迹；配对形成时累计 `semDomainPairTally`
- `[SEM]` 日志 `meta.domain` + 内容行 `domain CORE-R`
- 邻域窗口 `semReproWindow` / `semDomainWindow` = 48 tick

## 田野假说（7/7）

1. 链留置导入 ≥3 种子
2. 链深度 ≥5
3. full 组 PRQ ≥1（≥3 种子）
4. full CORE-R 密度 > pair0
5. full CORE-R 密度 > sem_plain（无标记）
6. full CORE-R 配对 ≥1（≥3 种子）
7. sem_plain 无域标记（semTagged = 0）

## 验证

```bash
npm run field:phase131
npm run field:phase131:verify
```

报告：`docs/field-phase131-report.json`
