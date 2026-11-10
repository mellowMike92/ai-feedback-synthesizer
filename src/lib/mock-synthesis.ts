import type {
  FeedbackInput,
  GrowthArea,
  Strength,
  SynthesizedFeedback,
} from '@/types/feedback';

interface Candidate<T> {
  keywords: RegExp;
  value: T;
}

const STRENGTH_POOL: Candidate<Strength>[] = [
  {
    keywords: /mentor|teach|pair|onboard|patient|explain/i,
    value: {
      category: 'Mentorship & Knowledge Sharing',
      evidence:
        'Multiple reviewers highlight patient, structured knowledge transfer — pairing through onboarding, explaining complex architecture accessibly, and investing time in junior growth.',
      impact:
        'Raises the technical ceiling of the whole team and shortens ramp-up time for new engineers.',
    },
  },
  {
    keywords: /own|carried|led|drove|unblock|deliver|accountab/i,
    value: {
      category: 'Ownership & Delivery',
      evidence:
        'Reviewers describe them carrying critical initiatives end-to-end — authoring RFCs, sequencing rollouts, and unblocking adjacent teams when plans changed.',
      impact:
        'De-risks complex cross-team programs and sets the execution bar for the org.',
    },
  },
  {
    keywords: /design doc|rfc|clear|document|edge case|writ(e|ing)/i,
    value: {
      category: 'Technical Communication',
      evidence:
        'Design documents and written communication called out as among the clearest on the team, surfacing edge cases before scoping.',
      impact:
        'Prevents costly rework and lets cross-functional partners plan with confidence.',
    },
  },
  {
    keywords: /collaborat|partner|cross.?functional|stakeholder|product/i,
    value: {
      category: 'Cross-Functional Partnership',
      evidence:
        'Product and engineering peers describe them as a preferred planning partner who bridges technical and business context.',
      impact:
        'Improves roadmap quality and reduces friction between engineering and product.',
    },
  },
  {
    keywords: /reliab|commit|quality|right|detail|thorough/i,
    value: {
      category: 'Engineering Rigor',
      evidence:
        'When they commit to work, reviewers consistently describe it landing correctly and to a high quality bar.',
      impact:
        'Builds organizational trust in commitments and reduces downstream defects.',
    },
  },
];

const GROWTH_POOL: Candidate<GrowthArea>[] = [
  {
    keywords: /terse|blunt|harsh|rework|review|feedback|condescend/i,
    value: {
      area: 'Feedback Delivery in Code Review',
      feedbackSynthesis:
        'Reviewers value the technical rigor of their PR feedback but note comments can land as terse or dismissive — e.g. rejection without rationale left a junior teammate deflated.',
      recommendation:
        'Pair every blocking comment with the "why" plus a suggested path forward; aim for one coaching note per review. Model the SBI format (situation, behavior, impact).',
    },
  },
  {
    keywords: /status|update|visibilit|slip|estimate|chase|late|deadline/i,
    value: {
      area: 'Status Visibility & Estimation',
      feedbackSynthesis:
        'Cross-functional partners had to chase status updates, and infra-heavy tasks ran materially over initial estimates, creating planning surprises.',
      recommendation:
        'Adopt proactive weekly status pings and re-estimate at the first sign of variance; pad infra work with an explicit uncertainty buffer.',
    },
  },
  {
    keywords: /delegat|absorb|scope creep|too much|calendar|meeting|focus|availab/i,
    value: {
      area: 'Delegation & Sustainable Scope',
      feedbackSynthesis:
        'Peers observe them absorbing extra work rather than flagging scope creep, holding onto gnarly problems themselves, and running a meeting-heavy calendar that limits availability.',
      recommendation:
        'Delegate one high-complexity task per sprint as a growth opportunity for a teammate; audit recurring meetings and decline non-essential ones.',
    },
  },
  {
    keywords: /impatient|rush|speed|shortcut/i,
    value: {
      area: 'Pacing & Sustainability',
      feedbackSynthesis:
        'A pattern of compressing timelines creates downstream pressure on teammates who inherit the work.',
      recommendation:
        'Build explicit buffers into sprint commitments and socialize trade-offs before accelerating.',
    },
  },
];

const SUMMARY_OPENERS: Record<FeedbackInput['desiredTone'], string> = {
  Direct: 'Peer feedback converges on a clear picture:',
  Empathetic: 'Reviewers clearly value working with {name}, and their feedback offers a supportive roadmap for growth:',
  Executive: 'Cross-reviewer synthesis yields a high-confidence assessment:',
  Growth_Oriented:
    'The feedback paints the picture of a high-impact contributor with well-scoped development edges:',
};

function pick<T>(pool: Candidate<T>[], notes: string, count: number): T[] {
  const scored = pool
    .map((c) => ({
      c,
      score: notes.match(new RegExp(c.keywords.source, 'gi'))?.length ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, count).map((s) => s.c.value);
  // fall back to pool order if nothing matched
  return top.length >= count ? top : pool.slice(0, count).map((c) => c.value);
}

export function buildMockSynthesis(input: FeedbackInput): SynthesizedFeedback {
  const notes = input.peerFeedbackNotes.join('\n\n');
  const firstName = input.employeeName.split(' ')[0];

  const strengths = pick(STRENGTH_POOL, notes, 3);
  const growthAreas = pick(GROWTH_POOL, notes, 2);

  const summary = SUMMARY_OPENERS[input.desiredTone].replace(
    '{name}',
    input.employeeName,
  );

  return {
    executiveSummary: `${summary} ${firstName} is a ${input.role} in ${input.department} who earns strong marks for ${strengths[0].category.toLowerCase()} and ${strengths[1].category.toLowerCase()}. The dominant development theme across ${input.peerFeedbackNotes.length} reviewers is ${growthAreas[0].area.toLowerCase()}, with ${growthAreas.length > 1 ? 'a secondary thread around ' + growthAreas[1].area.toLowerCase() : 'no significant secondary concerns'} — a coachable, scope-narrowed set of edges rather than fundamental gaps.`,
    topStrengths: strengths,
    growthAreas,
    actionableGoals: [
      {
        goal: `Deliver peer feedback and review comments using the SBI format, with a brief self-check against a written rubric before submitting`,
        timeframe: '30_Days',
        metric: '100% of blocking review comments include rationale and a suggested path forward',
      },
      {
        goal: `Establish a proactive status cadence: weekly async update to stakeholders plus early re-estimation on any task trending >20% over plan`,
        timeframe: '60_Days',
        metric: 'Zero "status chase" escalations from cross-functional partners over the period',
      },
      {
        goal: `Delegate at least one high-complexity task per sprint to a teammate, paired with a documented handoff and a follow-up coaching session`,
        timeframe: '90_Days',
        metric: '3+ delegated complex tasks completed by teammates with post-mortem notes shared',
      },
    ],
    coachingTalkingPoints: [
      `Open by recognizing the migration/ownership work — reviewers described ${firstName} as the person who "carried" critical projects. Anchor the conversation in that earned trust.`,
      `Ask: "How do you think your PR comments land on junior engineers?" — let them self-assess before sharing the peer observation about terse review feedback.`,
      `Explore the estimation/status thread: "What early signal tells you a task will slip, and what stops you from broadcasting it?" — connect it to partner trust, not just mechanics.`,
      `On delegation: frame holding onto hard problems as a scaling risk for the team, not a personal failing. Ask which teammate they'd most want to grow by handing off their next gnarly issue.`,
      `Close by co-authoring the 30-day commitment and agreeing on what evidence you'll both look for at the next 1:1.`,
    ],
  };
}
