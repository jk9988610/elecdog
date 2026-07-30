# Phase 120 · 观察台长时留置导入闭环

> Phase 119 田野报告（8192 tick · 六环境+链）→ 观察台混编续看。

---

## 修复

- `isFieldCarryReport` 不再强制 `treatmentIds` 数组；从 `aggregate` 键推导
- `summarizeCarryReport` — 显示 mixedTicks / 链深 / turbo

---

## 使用

1. 运行 `npm run field:phase119` 生成报告
2. 观察台 → **导入留置** → 选择 `field-phase119-report.json`
3. 混编 run 选 `ev119_long_8192 · seedN`
4. **载入混编批次**

```bash
npm run observer:carry-longfield
npm run observer:carry-batch
```

---

## 验证假说

| # | 内容 |
|---|------|
| H1 | Phase 119 报告可解析（无 treatmentIds） |
| H2 | mixedTicks ≥ 8192 |
| H3 | provenance 链深 ≥ 5（含 stress_echo + soc） |
| H4 | 观察台混编载入后链保留 |

---

*田野 8192 tick → 报告 → 观察台续看，闭环完成。*
