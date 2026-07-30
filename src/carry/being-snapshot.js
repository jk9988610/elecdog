/** Phase 106 — 进化留置个体快照（跨实验复活） */

export function snapshotBeing(being, provenance = {}) {
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
      tick: provenance.tick ?? 0,
      envId: provenance.envId ?? null,
      phase: provenance.phase ?? null,
      seed: provenance.seed ?? null,
      treatmentId: provenance.treatmentId ?? null,
      ...provenance,
    },
  };
}

export function snapshotBeings(beings, provenance = {}) {
  return beings.map((b) => snapshotBeing(b, provenance));
}
