# Phase 98 · 观察台环境栈可视化

> **一条主因果**：区带/地形/相位在观察台可实时观测；类比 UI only，不进 CODEX。

---

## 一、交付

| 组件 | 路径 |
|------|------|
| 环境栈面板 | `src/ui/env-stack.js` |
| 类比标签 | `src/ui/analogy.js` |
| 观察台环境 | `observer_w6_stack` |
| 初始化 | `initEnvStackModules` |
| 验证 | `npm run observer:env-stack` |

### 面板内容

| 列 | 显示 |
|----|------|
| 区位 | birthPlace、区带 E/M/P、patch、地形 L/O |
| 相位 | DLC 日相、SCL 季相、LTC 月相、AIR、PCP |
| 通道 | DLC/SCL/LTC/AIR/PCP 日志计数 |

### 类比呈现

原版模式：`区带 M`、`q2`、`相1`  
类比模式：中带、昼相、基准相等（**非 CODEX 定义**）

---

## 二、使用

1. 观察台环境下拉选择 **观察台·环境栈（W6）**
2. 工具栏切换 **原版 | 类比**
3. 运行若干 tick，环境栈面板实时更新

---

## 三、验证（2026-07-29）

```bash
npm run observer:env-stack
```

- 环境栈启用 ✓
- DLC/SCL 日志 ≥100 tick ✓
- CODEX 无区带词条 ✓

---

## 四、出口与下一步

- **已交付**：GAP-ENV 观察界面层
- **下一步**：田野深化 / 新 GAP 立项 — Phase 99 工具层 UI 已交付

---

*类比 UI 是观察辅助，不是世界定律。*
