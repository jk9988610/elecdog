# Phase 121 · GAP-13 × 8192 tick 合作因果

> Phase 118（960 tick）定律 weak 4/7 后，在 **8192 tick 长时** + 六环境+链 + turbo 上复验 COOP/SOC 因果。

---

## 田野对照

| 处理组 | mixedTicks | COOP/SOC | turbo |
|--------|------------|----------|-------|
| `ev121_coop_long` | 8192 | 开 | ✅ |
| `ev121_coop_off_long` | 8192 | 关 | ✅ |

```bash
npm run field:phase121
```

单次约 **~30s**（turbo），整批约 **~4min**。

---

## 假说（9 项）

继承 Phase 118 H1–H7，另加：

| # | 内容 |
|---|------|
| H8 | 8192 tick 完成率 ≥ 95% |
| H9 | 链深度 ≥ 5 |

---

*更长 tick 不保证定律成立；本阶段检验留置×合作在长时尺度是否可复现。*
