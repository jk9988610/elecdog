# Phase 135 · WL-R 观察台面板 + CODEX 联动

> 观察台新增「繁殖载荷域迹」面板，链至 CODEX 第 32/33 条；环境 `observer_wlr_stack` 启用 WL-R 全套开关。

---

## 交付

| 项 | 路径 |
|----|------|
| 面板 | `src/ui/wl-repro-stack.js` |
| 环境 | `observer_wlr_stack` |
| CODEX API | `codex.js` · `openEntry(id)` |
| 验证 | `npm run observer:wlr-stack` |

---

## 面板内容

- 旗标：DOM / LIN-R / 4DC
- 三列：域计数 · 四域耦合 · 繁殖谱系
- CODEX 按钮：繁殖载荷域迹、载荷共现迹

---

## 验证

```bash
npm run observer:wlr-stack
npm run gap-wlr:repro:codex
```
