/** Phase 106 — 进化留置个体快照（跨实验复活） */

export function snapshotBeing(being, provenance = {}) {
  const prior = being.carryProvenance ?? {};
  return {
    version: 1,
    code: being.code,
    name: being.name,
    dnaSequence: being.dna?.sequence ?? null,
    generation: being.generation ?? 0,
    registers: being.registers ? [...being.registers] : null,
    metProfile: being.metProfile ?? null,
    semTrace: being.semTrace?.length ? being.semTrace.map((e) => ({ ...e })) : null,
    semTraceWeight: being.semTraceWeight ?? 0,
    organismType: being.organismType ?? 'unicell',
    ecoRepro: being.ecoRepro === true,
    provenance: {
      ...prior,
      ...provenance,
      chain: prior.chain ?? provenance.chain,
      chainStage: provenance.chainStage ?? prior.chainStage,
    },
  };
}

export function snapshotBeings(beings, provenance = {}) {
  return beings.map((b) => snapshotBeing(b, provenance));
}

/** 合并链式 provenance（多环境留置） */
export function mergeCarryProvenance(snap, stage, extra = {}) {
  const prev = snap.provenance ?? {};
  const chain = [...(prev.chain ?? []), { stage, envId: extra.envId ?? prev.envId, tick: extra.tick ?? prev.tick }];
  return {
    ...snap,
    provenance: { ...prev, ...extra, chainStage: stage, chain },
  };
}
