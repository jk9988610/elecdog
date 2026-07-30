# Cursor 新对话交接

> 更新：2026-07-30 · WL-R 栈闭合 · 云辞典就绪 · **用户已转向**

---

## 战略状态

见 **[WL_REPRO_CENTER.md](WL_REPRO_CENTER.md)**

| 轨道 | 状态 |
|------|------|
| **WL-R1–R4**（SEM 域 · 跨代迹 · 2×2 · CODEX 第 32–33 条） | ✅ 闭合 |
| **Phase 135**（观察台 `wl-repro-stack` + `openEntry` 联动） | ✅ 闭合 |
| **云辞典**（33 条本地 · 云合并 · 发布脚本） | ✅ 就绪 |
| **WL-R 长时田野 / 深化开放项** | ⛔ **不再推进**（用户转向） |

**下一对话请从新方向开始**，勿自动续做长时田野、GAP-10 选择压、W5 长时验收等已归档项。

---

## 云辞典（本回合交付）

| 命令 | 说明 |
|------|------|
| `npm run codex:verify` | 本地合并逻辑 + 断言 33 条含 WL-R/SEM |
| `npm run codex:verify -- --cloud` | 可选云拉取（需 `SUPABASE_URL` / `SUPABASE_ANON_KEY`） |
| `npm run codex:publish` | 全量 33 条 upsert 到 Supabase |
| `npm run codex:publish:wlr` | 仅 SEM + WL-R 两条增量发布 |

观察台：`fetchCodexEntries()` + `mergeCodexEntries()` — 同 id 云覆盖本地。  
文档：[PHASE64_CODEX_CLOUD.md](PHASE64_CODEX_CLOUD.md)

---

## WL-R 栈验证（回归用）

```bash
npm run observer:wlr-stack      # 观察台面板
npm run gap-wlr:repro:codex     # CODEX 第 33 条
npm run codex:verify            # 云辞典本地验证
npm run field:phase133:verify   # WL-R3 2×2（可选回归）
```

---

## 关键文件

| 用途 | 路径 |
|------|------|
| 辞典数据（33 条） | `src/ui/codex-data.js` |
| 云同步 | `src/cloud/codex-sync.js` |
| 云发布/验证 | `scripts/codex-cloud-publish.mjs` · `codex-cloud-verify.mjs` |
| WL-R 观察面板 | `src/ui/wl-repro-stack.js` |
| SEM 域 / 谱系 | `src/world/sem-domain.js` · `sem-lineage.js` |
| 战略文档 | `docs/WL_REPRO_CENTER.md` |

---

## 已合并 PR 链（main 基线）

#142–#154：PAIR 繁殖线 Phase 124–130 → WL-R Phase 131–135 → 观察台面板。

本 PR：云辞典验证 + 交接文档 + 归档开放项。

---

*繁殖核 WL-R 栈已闭合；云辞典可同步；请从新战略接续。*
