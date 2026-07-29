# Phase 99 · 观察台工具/储备层扩展

> **一条主因果**：W6 工具/储备/厚度层（RSV/Synth/SYM/ART/VTN/MIG/DSP/ADV）在观察台可实时观测；类比 UI only。

---

## 一、交付

| 组件 | 路径 |
|------|------|
| 工具层列 | `src/ui/env-stack.js` · `tools` 摘要 |
| 类比标签 | `src/ui/analogy.js` |
| 验证 | `npm run observer:env-stack` |

### 新增显示

| 层 | 指标 |
|----|------|
| RSV | in/out、mean pool |
| Synth | A in / B out |
| SYM | 捕获计数 |
| ART | 活跃场态 / 沉积 |
| VTN | vent 活跃 / 注入 |
| MIG | patch、alt、迁徙次数 |
| DSP | yield、lost |
| ADV | flux、events |

---

## 二、验证（2026-07-29）

```bash
npm run observer:env-stack
```

- 环境栈 + 工具层启用 ✓
- RSV/DSP/ADV 摘要可读 ✓

---

## 三、出口与下一步

- **已交付**：W6 全栈观察界面闭环
- **下一步**：田野深化 / 新 GAP 立项

---

*工具层是观察辅助，不是新机制。*
