## MV 主轨进度（估算 **~62%**）

| 阶段 | 目标 | 状态 | 完成度 |
|------|------|------|--------|
| **MV0–MV1b** 发育/脐带 | STEM、GEST/JUV/ADT、[UMB] | ✅ | **~90%** |
| **MV1c** 成体 MIT 调参 | 同型 MIT、Z6 homeo | 🔄 | **~65%** |
| **MV5–MV7** 五感/结构/激素 | [SEN]、PAIR、[HRM] | ✅ #168–170 | **~80%** |
| **MV8** DNA 表达 | dna-express.js | ✅ #171 | **~75%** |
| **MV9** 闭环田野 | 全生命周期验收 | ✅ 本 PR | **~85%** |
| **MV2–MV4** UI/器官通路 | 族谱持久、观察子 | ⏳ | **0%** |

**下一包建议**：MV2 器官通路 · MV3 族谱持久 · MV1c 调参。

---

## 立项功能块快照

| 块 | 进度 |
|----|------|
| 发育 GEST→JUV→ADT | 🟡 闭环脚本 ✅ |
| 环境耦合 / 五感 / 激素 | 🟡 |
| 繁殖 PAIR + 哺乳 [LAC] | 🟡 #168 |
| DNA Z1–Z6 表达 | 🟡 #171 |
| 全生命周期闭环 | 🟡 本 PR |

---

## 验证命令

```bash
npm run observer:multicell-v2    # MV 主轨回归
npm run observer:dna-express       # Z1–Z6 分区哈希
npm run observer:mv-lifecycle      # MV9 全生命周期闭环
npm run observer:repro-speech
npm run codex:verify
```

---

*机制可观察 ≠ 定律已立。*
