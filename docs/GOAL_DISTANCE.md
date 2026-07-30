# 最终目标距离报告

> 更新：2026-07-30 · **主轨：哺乳生物 MV** · #177 简化繁殖 + DNA 血缘

---

## 如何读进度、如何告知他人

| 你想知道 | 看哪里 | 谁维护 |
|----------|--------|--------|
| **距哺乳生物总目标多远** | 本文 **「MV 主轨进度」** 表 + 估算百分比 | 每合并主轨 PR 后更新 |
| **当前在做什么 / 下一包** | [CURSOR_HANDOFF.md](CURSOR_HANDOFF.md) | 每回合交接时更新 |
| **阶段任务勾选清单** | [MULTICELL_V2_WORLD.md](MULTICELL_V2_WORLD.md) §十二 | 功能落地时勾选 |
| **机制详规** | [MULTICELL_V2_WORLD.md](MULTICELL_V2_WORLD.md)、[DNA_EXPRESSION.md](DNA_EXPRESSION.md) | 立项时写，变更时改 |
| **自动化回归是否过** | 本文 **「验证命令」** + PR 描述 | CI / 本地 `npm run observer:*` |
| **长期路线图** | [ROADMAP.md](ROADMAP.md) | 阶段里程碑，非每 PR 必改 |

**向协作者 / 新对话告知进度（推荐模板）**

1. **北极星一句**：哺乳类全生命周期在观察台可复盘（见上文哺乳生物轨）。
2. **完成度**：`GOAL_DISTANCE` 主轨表百分比（当前约 **~75%**）。
3. **本包交付**：PR 号 + 3～5 条能力（例：#177 8 成体开局、DNA 血缘、双向求偶、族谱树、泌乳可视化）。
4. **下一包**：`CURSOR_HANDOFF` 中的「建议下一包」。
5. **验收命令**：复制本文验证命令块，标明新增脚本名。

**向用户（你）在观察台侧感知进度**

- 打开观察台 → 环境 `multicell_v2_world` → **族谱布局**：8 成体、树状代际、选中个体看激素/泌乳/血缘。
- 日志/evolution：`[PRQ]`/`[PGR]`、`[UMB]`、`[LAC]`、`[EXP]` 等 kind 是否按预期出现。

---

## 哺乳生物轨 · 北极星

在电子狗世界中 **尽量完备模拟哺乳类全生命周期**（发育、五感、激素/神经、交配/脐带/哺乳结构、DNA 表达、近亲繁殖门控）。  
详规：[MULTICELL_V2_WORLD.md](MULTICELL_V2_WORLD.md) · [DNA_EXPRESSION.md](DNA_EXPRESSION.md)

---

## MV 主轨进度（估算 **~75%**）

| 阶段 | 目标 | 状态 | 完成度 |
|------|------|------|--------|
| **MV0–MV1b** 发育/脐带 | STEM、GEST/JUV/ADT、[UMB] | ✅ | **~90%** |
| **MV1c** 成体 MIT 调参 | 同型 MIT、STEM 冻结 | ✅ #176 | **~85%** |
| **MV2–MV4** UI/族谱 | 器官通路、持久、布局切换 | ✅ #173–175 | **~70%** |
| **MV5–MV7** 五感/结构/激素 | [SEN]、PAIR、[HRM] | ✅ #168–170 | **~80%** |
| **MV8** DNA 表达 | dna-express.js | ✅ #171 | **~75%** |
| **MV9** 闭环田野 | 全生命周期验收 | ✅ #172 | **~85%** |
| **MV10** 简化 + 繁殖门控 | 逻辑细胞精简、8 成体、血缘/求偶、族谱树 | ✅ #177 | **~80%** |

**下一包建议**（任选其一深化）：

- 族谱节点血缘徽章、实时激素 tick 动画
- 田野核对宫内 DIFF→EXP 全链（MV1b 未勾项）
- 求偶 AI 自动配对（在门控之上的行为层）

---

## 立项功能块快照

| 块 | 进度 |
|----|------|
| 发育 GEST→JUV→ADT | 🟢 闭环脚本 ✅ |
| 环境耦合 / 五感 / 激素 | 🟡 |
| 繁殖 PAIR + 哺乳 [LAC] | 🟢 #177 门控 + 体检报告 |
| DNA Z1–Z6 + 血缘检测 | 🟢 #177 |
| 全生命周期闭环 | 🟢 #172 |
| 族谱树状 UI + 泌乳可视 | 🟢 #177 |

---

## WL-R 轨（已交付 · 仅回归 **~93%**）

智慧语言 WL-R、留置链×PAIR、云辞典 33 条已闭合。见历史表；**不再主动扩展**长时田野/GAP-10。

| 轨道 | 完成度 |
|------|--------|
| WL0–5 + WL-R1–R4 | **100%** |
| 留置 + PAIR 链 | **~90–95%** |
| W5 长时 / GAP-10 | ⛔ 归档 |

---

## 验证命令

```bash
npm run observer:multicell-v2       # MV 主轨回归
npm run observer:repro-courtship      # #177 血缘/求偶门控
npm run observer:dna-express          # Z1–Z6 分区哈希
npm run observer:mv1c-mit             # MV1c 成体 MIT
npm run observer:mv-lifecycle         # MV9 全生命周期闭环
npm run observer:mv3-genealogy        # MV3 族谱持久
npm run observer:repro-speech
npm run codex:verify
```

---

*机制可观察 ≠ 定律已立。*
