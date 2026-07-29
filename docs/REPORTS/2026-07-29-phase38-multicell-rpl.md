# Phase 38 田野报告 · 多细胞 × RPL

> **日期**：2026-07-29 · `npm run field:phase38`

## 均值（四种子）

| 处理组 | FISS | 存活 | INTRA | 耗尽 |
|--------|------|------|-------|------|
| unicell_rpl | 12 | 16 | 0 | 16 |
| multicell_rpl | 12 | 16 | 141548 | 16 |
| multicell_subrpl | 7.5 | 11.5 | 102131 | 5 |

## 要点

- **共享 RPL**：多细胞与单域分裂率相同，但多 3× 子域单元可观察
- **子域分摊 RPL**：分裂与种群增长显著受抑（更严瓶颈）
- GAP-15 + GAP-17 交叉验证完成

见 [PHASE38_MULTICELL_RPL.md](../PHASE38_MULTICELL_RPL.md)
