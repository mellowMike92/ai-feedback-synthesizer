import type { FeedbackInput } from '@/types/feedback';

export const ROLE_OPTIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Software Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Designer',
  'Data Scientist',
  'QA Engineer',
  'Sales Executive',
  'People Partner',
] as const;

export const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Product',
  'Design',
  'Data & Analytics',
  'Sales',
  'Marketing',
  'People / HR',
  'Operations',
] as const;

export const SAMPLE_FEEDBACK: FeedbackInput = {
  employeeName: 'Jordan Alvarez',
  role: 'Senior Software Engineer',
  department: 'Engineering',
  desiredTone: 'Growth_Oriented',
  peerFeedbackNotes: [
    `Jordan basically carried the notification-service migration this quarter — wrote the RFC, sequenced the rollout, and unblocked two other teams when the event schema changed mid-flight. Honestly the project would have slipped a full sprint without them. One thing though: their PR reviews can be pretty terse. A junior on my squad got three "this won't work, rework" comments with no explanation and felt pretty deflated. Also Jordan tends to just absorb extra work instead of flagging scope creep, which I worry about long-term.`,
    `From the product side: Jordan is my favorite eng partner to plan with. Their design docs are the clearest on the team — they flag edge cases before we even scope them. Where I get frustrated is status visibility. On the billing-integration work I had to chase updates three separate times, and the infra tasks they estimated at 2 days took over a week. I'd rather get a "this is slipping" ping early than a surprise in standup. Still, when they commit to something it gets done right.`,
    `Jordan paired with me a lot during my onboarding and was incredibly patient — they explained the whole event-bus architecture by drawing it out, no condescension at all. Genuinely one of the best teachers on the team. The flip side is their calendar is wall-to-wall meetings so grabbing time is hard, and I've noticed they hold onto the gnarly debugging work themselves instead of delegating. I think the team would level up faster if they let others take those on.`,
  ],
};
