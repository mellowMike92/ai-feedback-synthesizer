'use client';

import { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  TerminalSquare,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASES = [
  { label: 'Extracting Strengths', key: /"topStrengths"/ },
  { label: 'Mapping Growth Areas', key: /"growthAreas"/ },
  { label: 'Generating 30-60-90 Goals', key: /"actionableGoals"/ },
  { label: 'Drafting Coaching Talking Points', key: /"coachingTalkingPoints"/ },
];

interface Props {
  partial: string;
  error: string | null;
  complete: boolean;
  onCancel: () => void;
}

export default function StreamingSynthesisView({
  partial,
  error,
  complete,
  onCancel,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [partial]);

  // Furthest phase key seen so far → earlier phases done, this one active.
  const furthest = PHASES.reduce(
    (acc, p, i) => (p.key.test(partial) ? i : acc),
    partial ? 0 : -1,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Phase checklist */}
      <div className="h-fit rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Loader2
            className={cn(
              'h-4 w-4',
              complete || error ? 'text-emerald-400' : 'animate-spin text-cyan-400',
            )}
          />
          Synthesis pipeline
        </h2>
        <ol className="space-y-3">
          {PHASES.map((phase, i) => {
            const done = complete || i < furthest;
            const active = !complete && !error && i === furthest;
            return (
              <li key={phase.label} className="flex items-center gap-2.5 text-sm">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-slate-700" />
                )}
                <span
                  className={cn(
                    done
                      ? 'text-slate-300'
                      : active
                        ? 'text-cyan-300'
                        : 'text-slate-600',
                  )}
                >
                  {phase.label}
                </span>
              </li>
            );
          })}
        </ol>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-rose-500/50 hover:text-rose-300"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>

      {/* Raw stream terminal */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 flex items-center gap-1.5 font-mono text-xs text-slate-400">
              <TerminalSquare className="h-3.5 w-3.5" />
              POST /api/synthesize — tool_use input_json_delta stream
            </span>
          </div>
          <span
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
              complete
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                  complete ? 'bg-emerald-400' : 'bg-cyan-400',
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  complete ? 'bg-emerald-400' : 'bg-cyan-400',
                )}
              />
            </span>
            {complete ? 'complete' : 'streaming'}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="terminal-scroll h-[28rem] overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        >
          {partial ? (
            <pre
              className={cn(
                'whitespace-pre-wrap break-words text-emerald-300/90',
                !complete && 'json-cursor',
              )}
            >
              {partial}
            </pre>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>
                awaiting first token — connecting to Claude with forced tool
                choice…
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
