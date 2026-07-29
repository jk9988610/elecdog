/**
 * 智慧生命诞生条件检查表 — 对齐 docs/WISDOM.md §3.2
 */

export const WISDOM_LAYERS = [
  {
    id: 'L1',
    label: '存在论',
    items: [
      { id: 'L1-boundary', label: '个体边界与持续过程', status: 'complete', phase: '17-20' },
    ],
  },
  {
    id: 'L2',
    label: '演化',
    items: [
      { id: 'L2a-variation', label: '可遗传变异', status: 'complete', phase: '17-42' },
      { id: 'L2b-selection', label: '非随机存续差异（END/SEL）', status: 'partial', phase: '26' },
      { id: 'L2c-repeatable', label: '选择压跨种子可重复', status: 'open', gap: 'GAP-10', goal: 'W2' },
    ],
  },
  {
    id: 'L3',
    label: '耦合',
    items: [
      { id: 'L3a-coupling', label: '环境–行为双向耦合', status: 'complete', phase: '13-19' },
      { id: 'L3b-resource', label: '资源约束（LOW/stress）', status: 'complete', phase: '14-17' },
      { id: 'L3c-social', label: '多体信号与社会迹', status: 'complete', phase: '3-16' },
    ],
  },
  {
    id: 'L4',
    label: '认知闭环',
    items: [
      { id: 'L4a-mem-fb', label: '记忆影响行为', status: 'complete', phase: '70', goal: 'W1' },
      { id: 'L4b-mem-field', label: '记忆反馈田野可对照', status: 'complete', phase: '70' },
      { id: 'L4c-predict', label: '预测–校正回路', status: 'pending', phase: '73-74', goal: 'W3' },
    ],
  },
  {
    id: 'L5',
    label: '社会放大',
    items: [
      { id: 'L5a-signal', label: '跨个体信号链', status: 'complete', phase: '3-6' },
      { id: 'L5b-culture', label: '非遗传信息累积', status: 'pending', phase: '75+', goal: 'W4' },
    ],
  },
  {
    id: 'L6',
    label: '开放度',
    items: [
      { id: 'L6a-depth', label: '多代深度 ≥20', status: 'complete', phase: '21-26' },
      { id: 'L6b-open', label: '开放泛化', status: 'pending', phase: '77+', goal: 'W5' },
    ],
  },
];

export const WISDOM_PHASE_ROADMAP = [
  { phase: 70, goal: 'W1', label: '记忆→行为闭环' },
  { phase: 71, goal: 'W2', label: '选择压可重复性度量' },
  { phase: 72, goal: 'W2', label: '选择压强化环境' },
  { phase: 73, goal: 'W3', label: '预测误差记录' },
  { phase: 74, goal: 'W3', label: '预测–校正反馈' },
  { phase: 75, goal: 'W4', label: '社会知识累积' },
  { phase: 76, goal: 'W4', label: '谱系记忆回响' },
  { phase: 77, goal: 'W5', label: '长时开放演化田野' },
];

/**
 * @param {{ memoryFeedbackInCode?: boolean, phase70FieldVerdict?: string }} [opts]
 */
export function assessWisdomConditions(opts = {}) {
  const items = WISDOM_LAYERS.flatMap((layer) =>
    layer.items.map((item) => {
      let status = item.status;
      if (item.id === 'L4a-mem-fb' && opts.memoryFeedbackInCode && status !== 'complete') {
        status = 'in_progress';
      }
      if (
        opts.phase70FieldVerdict === 'support' &&
        (item.id === 'L4a-mem-fb' || item.id === 'L4b-mem-field')
      ) {
        status = 'complete';
      }
      return { ...item, layer: layer.id, layerLabel: layer.label, status };
    })
  );

  const complete = items.filter((i) => i.status === 'complete').length;
  const partial = items.filter((i) => i.status === 'partial' || i.status === 'in_progress').length;
  const open = items.filter((i) => i.status === 'open' || i.status === 'pending').length;

  return {
    northStar: '诞生智慧生命',
    items,
    summary: { complete, partial, open, total: items.length },
    progressPct: Math.round((complete / items.length) * 100),
    currentPhase: 71,
    currentGoal: 'W2',
    roadmap: 'docs/WISDOM.md',
  };
}
