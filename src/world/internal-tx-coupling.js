// 脑演化 — internal 思考流 → [TX] 外化耦合（非预制地球语词典）

export function internalTxCouplingEnabled(profile) {
  return profile?.internalTxCoupling === true;
}

export function initInternalTxCoupling(being) {
  being.internalTxHits = 0;
  being.internalTxLoad = 0;
  being.lastInternalTxSource = null;
  being.internalTxAppliedTick = null;
}

function extractBytesFromLine(line) {
  const parts = [...String(line).matchAll(/0x([0-9a-fA-F]{2})/gi)];
  if (parts.length < 3) return null;
  return parts.slice(0, 3).map((m) => m[1].toUpperCase());
}

function toHexByte(n) {
  return Math.floor(Math.max(0, Math.min(255, n)))
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

/** 由末条 internal + 预测误差 + 记忆负载 推导 TX 三字节候选 */
export function deriveInternalTxCoupling(internalLines, being, profile, experienceBias = null) {
  if (!internalLines?.length) return null;

  const strength = profile?.internalTxCouplingStrength ?? 0.5;
  const sourceInternal = internalLines[internalLines.length - 1];
  const bytes = extractBytesFromLine(sourceInternal);
  if (!bytes) return null;

  let [op, payload, chk] = bytes;

  const prd = being.prdLastError ?? 0;
  if (prd > 0.06) {
    const bump = Math.floor(prd * 200);
    chk = toHexByte(parseInt(chk, 16) ^ (bump & 0xff));
  }

  const mem = (being.memRxLoad ?? 0) + (being.memTxLoad ?? 0) * 0.5;
  const prdLoad = experienceBias?.prdLoad ?? 0;
  const semLoad = experienceBias?.semLoad ?? 0;

  let load = strength + mem * 0.12 + prdLoad * 0.08;
  if (experienceBias?.txPayloadHint && semLoad > 0.25) {
    const hintBytes = experienceBias.txPayloadHint.match(/.{2}/g);
    if (hintBytes?.length >= 2) {
      payload = hintBytes[1].toUpperCase();
      load = Math.min(1, load + semLoad * 0.15);
    }
  }
  load = +Math.min(1, load).toFixed(4);

  return { op, payload, chk, load, sourceInternal };
}

/** 按 load 概率将 TX 载荷替换为思考流衍生字节 */
export function applyInternalTxCoupling(op, payload, chk, coupling, rng) {
  if (!coupling || coupling.load <= 0) {
    return { op, payload, chk, applied: false };
  }
  if (rng() > coupling.load) {
    return { op, payload, chk, applied: false };
  }
  return {
    op: coupling.op,
    payload: coupling.payload,
    chk: coupling.chk,
    applied: true,
    sourceInternal: coupling.sourceInternal,
    load: coupling.load,
  };
}

export function internalTxSnapshot(being) {
  return {
    hits: being.internalTxHits ?? 0,
    load: being.internalTxLoad ?? 0,
    lastSource: being.lastInternalTxSource ?? null,
  };
}
