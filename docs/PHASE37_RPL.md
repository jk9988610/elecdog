# Phase 37 · 复制配额 [RPL]（分裂次数与寿命顶）

> **目标**：为 DNA 建立可观察的**剩余复制次数**，类比地球端粒/海弗利克极限；  
> 验证富足场下 `[FISS]` 从「顶满种群」变为「S 型受控增长」。

---

## 一、地球对照 → 电子狗

| 地球 | 电子狗 Phase 37 |
|------|-----------------|
| 端粒每次复制缩短 | `[RPL]` 每 `[FISS]` / `[LINEAGE]` −1 |
| 端粒酶 / 干细胞 | **未实现**（无重置通道） |
| 分裂次数到顶停分裂 | `rplRemaining ≤ 0` → 关闭 `[FISS]` 门 |
| 衰老 / 凋亡 | 可选 `rplSenescenceEnd` → `[END] reason rpl_exhausted` |
| 时间寿命 | 可选 `rplTickCapEnabled` → `[END] reason rpl_tick_cap` |
| DNA 个体差异 | `dna.sequence` 哈希 → 初始配额 6–11 |

---

## 二、环境对照

| ID | RPL | 耗尽后 |
|----|-----|--------|
| `fertile_field_open` | 关 | 种群顶 36（Phase 36 复现） |
| `fertile_field` | 开 | 停分裂；亲代存活 |
| `fertile_field_strict` | 开 + tick 顶 | `[END]` 增多 |

---

## 三、通道

| 标记 | 含义 |
|------|------|
| `[RPL] init` | 诞生配额 |
| `[RPL] fiss` | 存活分裂扣减 |
| `[RPL] lineage` | 谱系诞生扣减 |
| `[RPL] exhausted` | 配额归零事实 |

---

## 四、田野

```bash
npm run field:phase37
```

观察台：**富足分裂场（有复制上限）** 等环境已接入；个体卡片显示 `RPL 剩余/上限`。

---

## 五、GAP-17

复制寿命与分裂次数上限 — 见 [GAPS.md](GAPS.md)
