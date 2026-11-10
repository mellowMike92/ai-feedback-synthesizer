import { z } from 'zod';

export const DesiredToneSchema = z.enum([
  'Direct',
  'Empathetic',
  'Executive',
  'Growth_Oriented',
]);

export type DesiredTone = z.infer<typeof DesiredToneSchema>;

export const FeedbackInputSchema = z.object({
  employeeName: z.string().min(1),
  role: z.string().min(1),
  department: z.string().min(1),
  peerFeedbackNotes: z.array(z.string().min(1)).min(1),
  desiredTone: DesiredToneSchema,
});

export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

export const SynthesizedFeedbackSchema = z.object({
  executiveSummary: z.string(),
  topStrengths: z.array(
    z.object({
      category: z.string(),
      evidence: z.string(),
      impact: z.string(),
    }),
  ),
  growthAreas: z.array(
    z.object({
      area: z.string(),
      feedbackSynthesis: z.string(),
      recommendation: z.string(),
    }),
  ),
  actionableGoals: z.array(
    z.object({
      goal: z.string(),
      timeframe: z.enum(['30_Days', '60_Days', '90_Days']),
      metric: z.string(),
    }),
  ),
  coachingTalkingPoints: z.array(z.string()),
});

export type SynthesizedFeedback = z.infer<typeof SynthesizedFeedbackSchema>;

export type Strength = SynthesizedFeedback['topStrengths'][number];
export type GrowthArea = SynthesizedFeedback['growthAreas'][number];
export type ActionableGoal = SynthesizedFeedback['actionableGoals'][number];

export const TIMEFRAME_LABELS: Record<ActionableGoal['timeframe'], string> = {
  '30_Days': '30 Days',
  '60_Days': '60 Days',
  '90_Days': '90 Days',
};

export type SynthesisStreamEvent =
  | { type: 'status'; phase: 'connecting' | 'streaming' | 'finalizing' }
  | { type: 'delta'; partial: string }
  | { type: 'result'; payload: SynthesizedFeedback }
  | { type: 'error'; message: string };
