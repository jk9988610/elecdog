/** 田野记录器 — turbo 模式仅聚合计数，不保留 entries（空间换时间） */

import { StatsRecorder } from '../../src/recorder/stats-recorder.js';

export function createFieldRecorder(profile) {
  return new StatsRecorder({ turbo: profile?.fieldTurboMode === true });
}
