# Phase 111 · 观察台导入留置快照

> 从田野报告 JSON 选择留置个体，载入观察台继续观察 provenance 链与 trace。

---

## 数据流

```
田野批次 field:phase109/110
    → report JSON 含 carrySnapshots（完整 DNA + semTrace + provenance）
    → 观察台「导入留置」面板
    → spawnCarriedBeing 载入
```

---

## 使用

1. 运行田野生成报告：`npm run field:phase110`
2. 观察台点击 **导入留置**
3. 选择 `docs/field-phase110-report.json`（或本地副本）
4. 下拉选择条目 → **载入留置**

自动推断观察环境（如 `fertile_field`）。

```bash
npm run observer:carry-import
```

---

## 报告字段

田野 `runFieldCarryScenario` 现导出：

| 字段 | 说明 |
|------|------|
| `carries` | 摘要（代次、链环境） |
| `carrySnapshots` | 可复活完整快照 |

Phase 111 之前的报告仅含摘要，需重新跑田野批次。

---

*田野塑形 → 观察台续看，闭环留置链。*
