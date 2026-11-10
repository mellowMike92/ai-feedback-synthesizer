import {
  TIMEFRAME_LABELS,
  type FeedbackInput,
  type SynthesizedFeedback,
} from '@/types/feedback';

export function toMarkdown(
  data: SynthesizedFeedback,
  meta: Pick<FeedbackInput, 'employeeName' | 'role' | 'department' | 'desiredTone'>,
): string {
  const lines: string[] = [
    `# 1:1 Coaching Rubric — ${meta.employeeName}`,
    '',
    `**Role:** ${meta.role}  `,
    `**Department:** ${meta.department}  `,
    `**Coaching tone:** ${meta.desiredTone}  `,
    `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## Executive Summary',
    '',
    data.executiveSummary,
    '',
    '## Top Strengths',
    '',
  ];

  for (const s of data.topStrengths) {
    lines.push(`### ${s.category}`, '', `- **Evidence:** ${s.evidence}`, `- **Impact:** ${s.impact}`, '');
  }

  lines.push('## Growth Areas', '');
  for (const g of data.growthAreas) {
    lines.push(
      `### ${g.area}`,
      '',
      `- **Feedback synthesis:** ${g.feedbackSynthesis}`,
      `- **Recommendation:** ${g.recommendation}`,
      '',
    );
  }

  lines.push('## 30-60-90 Day Goals', '');
  for (const tf of ['30_Days', '60_Days', '90_Days'] as const) {
    const goals = data.actionableGoals.filter((g) => g.timeframe === tf);
    if (!goals.length) continue;
    lines.push(`### ${TIMEFRAME_LABELS[tf]}`, '');
    for (const g of goals) {
      lines.push(`- ${g.goal}`, `  - *Metric:* ${g.metric}`);
    }
    lines.push('');
  }

  lines.push('## Coaching Talking Points', '');
  for (const p of data.coachingTalkingPoints) {
    lines.push(`- ${p}`);
  }
  lines.push('');

  return lines.join('\n');
}
