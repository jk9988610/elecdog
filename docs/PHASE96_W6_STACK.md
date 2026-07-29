# Phase 96 · W6 全栈耦合验收

> **一条主因果**：W5 智慧栈 + Phase 84–95 工具/储备/环境层在同一田野可观测、可对照。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | `w6_stack_on` 激活 ≥6 层机制（RSV/Synth/SYM/ENV/ART/VTN/MIG/DSP） | 与 off 无层差 |
| H2 | 全栈开启后 W5 智慧指标不崩溃 | alive < 4 或 W1/W5 unsupport |
| H3 | off→on 层深度差可测（Δlayers ≥ 4） | 无层差 |
| H4 | 仍禁止地球式命名（数字原生优先） | — |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 处理组 | `PHASE96_TREATMENTS` in `env-profile.js` |
| 分析 | `scripts/lib/phase96-analyze.js` |
| 田野 | `npm run field:phase96` |

### 处理组

| ID | 说明 |
|----|------|
| `w6_stack_off` | W5 智慧完整栈，显式关闭 84+ 机制 |
| `w6_stack_on` | W5 + RSV/Synth/SYM + DLC/PCP/SCL/air/ADV/LTC/ART/VTN/MIG/DSP |

### 验收层

| 层 | 指标 |
|----|------|
| 全栈深度 | `layersActive`（9 层布尔） |
| W1 | meanMemLoad ≥ 0.1 |
| W3 | prdCount ≥ 50 |
| W4 | socEnc + memLin |
| W5 | alive + coop |

---

## 三、田野结果

（运行 `npm run field:phase96` 后更新）

报告：`docs/field-phase96-report.json`

---

## 四、出口与下一步

- **已交付**：W6 全栈耦合验收田野框架
- **下一步**：CODEX 化 / 观察台 UI 深化

---

*W6 是耦合验收，不是新机制堆砌。*
