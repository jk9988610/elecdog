# Phase 82 · 智慧物种田野验收准备

> **智慧演化线里程碑**：聚合 Phase 70–81 田野成果，运行综合验收田野，输出验收报告。

---

## 一、验收框架

| 组件 | 路径 |
|------|------|
| 综合田野 | `npm run field:phase82` |
| 验收汇总 | `npm run wisdom:acceptance` |
| 检查表 | `npm run wisdom:checklist` |
| 报告 | `docs/wisdom-acceptance-report.json` |

### 处理组（1920 tick）

| ID | 说明 |
|----|------|
| `w82_accept_std` | 智慧完整栈标准情境 |
| `w82_accept_audit` | 智慧完整栈审计情境（剧变） |

### 验收层（Phase 82 田野）

| 层 | 指标 | 阈值 |
|----|------|------|
| W1 | meanMemLoad | ≥ 0.1 |
| W3 | prdCount | ≥ 50 |
| W4 | socEnc + memLin | ≥ 30 + ≥ 8 |
| W5 | alive + coop | ≥ 8 + ≥ 5 |

---

## 二、田野结果（2026-07-29）

12体 × **1920** tick × 4 种子 × 2 情境

| 验收层 | support |
|--------|---------|
| W1_memoryLoop | **8/8** |
| W3_prediction | **8/8** |
| W4_social | **8/8** |
| W5_openScale | **8/8** |

- 综合田野 **support**
- 验收层就绪 ✓

报告：`docs/field-phase82-report.json`

---

## 三、W 目标田野汇总

| 目标 | Phase | 田野判定 |
|------|-------|----------|
| W1 记忆闭环 | 70 | support |
| W2 选择压 | 72 | support（GAP-10 partial 3/4） |
| W3 预测–校正 | 74 | support |
| W4 社会/谱系 | 75–76 | support |
| W5 开放尺度 | 77–78 | support |
| 综合验收 | 82 | support |

**验收状态：prepared**（检查表 12/14）

---

## 四、已知开放项

| 项 | 状态 | 说明 |
|----|------|------|
| L2b 非随机存续差异 | partial | SEL 信号弱 |
| L2c 选择压跨种子可重复 | partial | GAP-10 · Phase 72 最佳 3/4 |
| 正式物种结案 | 未达成 | 需 L2 闭合或接受 partial 上限 |

---

## 五、验证命令

```bash
npm run field:phase82
npm run wisdom:acceptance
npm run wisdom:checklist
```

---

*Phase 82 · 智慧物种田野验收 prepared · L2 partial 仍开放*
