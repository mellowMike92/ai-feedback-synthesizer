'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  FileDown,
  Lightbulb,
  ListChecks,
  Plus,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toMarkdown } from '@/lib/markdown';
import {
  DesiredToneSchema,
  TIMEFRAME_LABELS,
  type ActionableGoal,
  type DesiredTone,
  type FeedbackInput,
  type SynthesizedFeedback,
} from '@/types/feedback';

interface Props {
  data: SynthesizedFeedback;
  meta: FeedbackInput;
  onChange: (next: SynthesizedFeedback) => void;
  onRegenerate: (tone: DesiredTone) => void;
  onStartOver: () => void;
}

const field =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-slate-200 transition placeholder:text-slate-600 hover:border-slate-700 focus:border-cyan-500/60 focus:bg-slate-900/70 focus:outline-none';

const TIMEFRAMES = ['30_Days', '60_Days', '90_Days'] as const;

export default function ManagerReviewDashboard({
  data,
  meta,
  onChange,
  onRegenerate,
  onStartOver,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<DesiredTone>(meta.desiredTone);

  const update = (fn: (draft: SynthesizedFeedback) => void) => {
    const next = structuredClone(data);
    fn(next);
    onChange(next);
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(toMarkdown(data, meta));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <select
            value={tone}
            onChange={(e) => setTone(DesiredToneSchema.parse(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/60 focus:outline-none"
            aria-label="Coaching tone"
          >
            {DesiredToneSchema.options.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onRegenerate(tone)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-sm font-medium text-indigo-300 transition hover:border-indigo-400/60 hover:bg-indigo-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy Markdown'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-400 transition hover:border-rose-500/50 hover:text-rose-300"
          >
            <RotateCcw className="h-4 w-4" />
            Start over
          </button>
        </div>
      </div>

      {/* Subject header */}
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold text-slate-50">
          {meta.employeeName}
          <span className="ml-3 text-base font-medium text-slate-400">
            {meta.role} · {meta.department}
          </span>
        </h2>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
          {meta.peerFeedbackNotes.length} reviewers ·{' '}
          {meta.desiredTone.replace(/_/g, ' ')} tone
        </span>
      </div>

      {/* Executive summary */}
      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
          <Lightbulb className="h-4 w-4" />
          Executive Summary
        </h3>
        <textarea
          value={data.executiveSummary}
          onChange={(e) =>
            update((d) => {
              d.executiveSummary = e.target.value;
            })
          }
          rows={4}
          className={cn(field, 'resize-y leading-relaxed')}
        />
      </section>

      {/* Strengths */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            Top Strengths
          </h3>
          <AddButton
            onClick={() =>
              update((d) => {
                d.topStrengths.push({
                  category: 'New strength',
                  evidence: '',
                  impact: '',
                });
              })
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {data.topStrengths.map((s, i) => (
            <EditableCard
              key={i}
              onRemove={() =>
                update((d) => {
                  d.topStrengths.splice(i, 1);
                })
              }
            >
              <input
                value={s.category}
                onChange={(e) =>
                  update((d) => {
                    d.topStrengths[i].category = e.target.value;
                  })
                }
                className={cn(field, 'font-semibold text-emerald-300')}
                placeholder="Category"
              />
              <FieldLabel>Evidence</FieldLabel>
              <textarea
                value={s.evidence}
                onChange={(e) =>
                  update((d) => {
                    d.topStrengths[i].evidence = e.target.value;
                  })
                }
                rows={4}
                className={cn(field, 'resize-y text-slate-400')}
              />
              <FieldLabel>Impact</FieldLabel>
              <textarea
                value={s.impact}
                onChange={(e) =>
                  update((d) => {
                    d.topStrengths[i].impact = e.target.value;
                  })
                }
                rows={3}
                className={cn(field, 'resize-y text-slate-400')}
              />
            </EditableCard>
          ))}
        </div>
      </section>

      {/* Growth areas */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
            <Target className="h-4 w-4" />
            Growth Areas
          </h3>
          <AddButton
            onClick={() =>
              update((d) => {
                d.growthAreas.push({
                  area: 'New growth area',
                  feedbackSynthesis: '',
                  recommendation: '',
                });
              })
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.growthAreas.map((g, i) => (
            <EditableCard
              key={i}
              onRemove={() =>
                update((d) => {
                  d.growthAreas.splice(i, 1);
                })
              }
            >
              <input
                value={g.area}
                onChange={(e) =>
                  update((d) => {
                    d.growthAreas[i].area = e.target.value;
                  })
                }
                className={cn(field, 'font-semibold text-amber-300')}
                placeholder="Growth area"
              />
              <FieldLabel>Feedback synthesis</FieldLabel>
              <textarea
                value={g.feedbackSynthesis}
                onChange={(e) =>
                  update((d) => {
                    d.growthAreas[i].feedbackSynthesis = e.target.value;
                  })
                }
                rows={4}
                className={cn(field, 'resize-y text-slate-400')}
              />
              <FieldLabel>Recommendation</FieldLabel>
              <textarea
                value={g.recommendation}
                onChange={(e) =>
                  update((d) => {
                    d.growthAreas[i].recommendation = e.target.value;
                  })
                }
                rows={3}
                className={cn(field, 'resize-y text-slate-400')}
              />
            </EditableCard>
          ))}
        </div>
      </section>

      {/* 30-60-90 goals */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-400">
            <ListChecks className="h-4 w-4" />
            30-60-90 Day Goals
          </h3>
          <AddButton
            onClick={() =>
              update((d) => {
                d.actionableGoals.push({
                  goal: 'New goal',
                  timeframe: '30_Days',
                  metric: '',
                });
              })
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TIMEFRAMES.map((tf) => (
            <div
              key={tf}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur"
            >
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-300">
                {TIMEFRAME_LABELS[tf]}
              </h4>
              <div className="space-y-3">
                {data.actionableGoals.map((g, i) =>
                  g.timeframe === tf ? (
                    <div
                      key={i}
                      className="group rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="mb-1 flex items-start justify-between gap-1">
                        <select
                          value={g.timeframe}
                          onChange={(e) =>
                            update((d) => {
                              d.actionableGoals[i].timeframe = e.target
                                .value as ActionableGoal['timeframe'];
                            })
                          }
                          className="rounded border border-transparent bg-transparent text-[10px] font-semibold uppercase tracking-wide text-indigo-400 hover:border-slate-700 focus:outline-none"
                        >
                          {TIMEFRAMES.map((t) => (
                            <option key={t} value={t}>
                              {TIMEFRAME_LABELS[t]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            update((d) => {
                              d.actionableGoals.splice(i, 1);
                            })
                          }
                          className="rounded p-1 text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                          aria-label="Remove goal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={g.goal}
                        onChange={(e) =>
                          update((d) => {
                            d.actionableGoals[i].goal = e.target.value;
                          })
                        }
                        rows={4}
                        className={cn(field, 'resize-y')}
                        placeholder="Goal"
                      />
                      <FieldLabel>Metric</FieldLabel>
                      <textarea
                        value={g.metric}
                        onChange={(e) =>
                          update((d) => {
                            d.actionableGoals[i].metric = e.target.value;
                          })
                        }
                        rows={2}
                        className={cn(field, 'resize-y text-slate-400')}
                        placeholder="How success is measured"
                      />
                    </div>
                  ) : null,
                )}
                {data.actionableGoals.every((g) => g.timeframe !== tf) && (
                  <p className="text-xs italic text-slate-600">
                    No goals for this horizon
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Talking points */}
      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            <ListChecks className="h-4 w-4" />
            Coaching Talking Points
          </h3>
          <AddButton
            onClick={() =>
              update((d) => {
                d.coachingTalkingPoints.push('');
              })
            }
          />
        </div>
        <ol className="space-y-2">
          {data.coachingTalkingPoints.map((p, i) => (
            <li key={i} className="group flex items-start gap-3">
              <span className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 text-[10px] font-bold text-cyan-400">
                {i + 1}
              </span>
              <textarea
                value={p}
                onChange={(e) =>
                  update((d) => {
                    d.coachingTalkingPoints[i] = e.target.value;
                  })
                }
                rows={2}
                className={cn(field, 'flex-1 resize-y leading-relaxed')}
                placeholder="Talking point"
              />
              <button
                type="button"
                onClick={() =>
                  update((d) => {
                    d.coachingTalkingPoints.splice(i, 1);
                  })
                }
                className="mt-2 rounded p-1 text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                aria-label={`Remove talking point ${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* Print-only report */}
      <div id="print-report" className="hidden print:block">
        <h1>1:1 Coaching Rubric — {meta.employeeName}</h1>
        <p>
          <strong>Role:</strong> {meta.role} &nbsp;·&nbsp;{' '}
          <strong>Department:</strong> {meta.department} &nbsp;·&nbsp;{' '}
          <strong>Tone:</strong> {meta.desiredTone.replace(/_/g, ' ')}
        </p>
        <h2>Executive Summary</h2>
        <p>{data.executiveSummary}</p>
        <h2>Top Strengths</h2>
        {data.topStrengths.map((s, i) => (
          <div key={i}>
            <h3>{s.category}</h3>
            <p>
              <strong>Evidence:</strong> {s.evidence}
            </p>
            <p>
              <strong>Impact:</strong> {s.impact}
            </p>
          </div>
        ))}
        <h2>Growth Areas</h2>
        {data.growthAreas.map((g, i) => (
          <div key={i}>
            <h3>{g.area}</h3>
            <p>
              <strong>Feedback synthesis:</strong> {g.feedbackSynthesis}
            </p>
            <p>
              <strong>Recommendation:</strong> {g.recommendation}
            </p>
          </div>
        ))}
        <h2>30-60-90 Day Goals</h2>
        {TIMEFRAMES.map((tf) => {
          const goals = data.actionableGoals.filter(
            (g) => g.timeframe === tf,
          );
          return goals.length ? (
            <div key={tf}>
              <h3>{TIMEFRAME_LABELS[tf]}</h3>
              <ul>
                {goals.map((g, i) => (
                  <li key={i}>
                    {g.goal} — <em>Metric: {g.metric}</em>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })}
        <h2>Coaching Talking Points</h2>
        <ol>
          {data.coachingTalkingPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-2 block px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </span>
  );
}

function EditableCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 rounded p-1 text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
        aria-label="Remove card"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-cyan-500/50 hover:text-cyan-300"
    >
      <Plus className="h-3.5 w-3.5" />
      Add
    </button>
  );
}
