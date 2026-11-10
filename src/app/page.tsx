'use client';

import { useCallback, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import FeedbackInputForm from '@/components/FeedbackInputForm';
import StreamingSynthesisView from '@/components/StreamingSynthesisView';
import ManagerReviewDashboard from '@/components/ManagerReviewDashboard';
import { cn } from '@/lib/utils';
import type {
  FeedbackInput,
  SynthesisStreamEvent,
  SynthesizedFeedback,
} from '@/types/feedback';

type WizardStep = 'input' | 'synthesizing' | 'review';

const STEPS: { id: WizardStep; label: string; icon: typeof FileText }[] = [
  { id: 'input', label: 'Input Feedback', icon: FileText },
  { id: 'synthesizing', label: 'Synthesizing', icon: Loader2 },
  { id: 'review', label: 'Manager Review & Export', icon: ClipboardList },
];

export default function Home() {
  const [step, setStep] = useState<WizardStep>('input');
  const [input, setInput] = useState<FeedbackInput | null>(null);
  const [partialJson, setPartialJson] = useState('');
  const [result, setResult] = useState<SynthesizedFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSynthesis = useCallback(async (payload: FeedbackInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setInput(payload);
    setPartialJson('');
    setResult(null);
    setError(null);
    setStep('synthesizing');

    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => null);
        throw new Error(
          detail?.error ?? `Request failed with status ${res.status}`,
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotResult = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith('data:')) continue;
          const event = JSON.parse(line.slice(5)) as SynthesisStreamEvent;

          if (event.type === 'delta') {
            setPartialJson(event.partial);
          } else if (event.type === 'result') {
            gotResult = true;
            setResult(event.payload);
          } else if (event.type === 'error') {
            setError(event.message);
          }
        }
      }

      if (gotResult) {
        setStep('review');
      } else {
        setError((e) => e ?? 'Stream ended without a result payload');
        setStep('input');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Synthesis failed');
      setStep('input');
    }
  }, []);

  const handleRegenerate = useCallback(
    (tone: FeedbackInput['desiredTone']) => {
      if (!input) return;
      runSynthesis({ ...input, desiredTone: tone });
    },
    [input, runSynthesis],
  );

  const handleStartOver = useCallback(() => {
    abortRef.current?.abort();
    setStep('input');
    setResult(null);
    setPartialJson('');
    setError(null);
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300">
          <Sparkles className="h-4 w-4" />
          AI-Powered Performance &amp; Feedback Synthesizer
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
          Peer Feedback →{' '}
          <span className="text-cyan-400">Coaching Rubric</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
          Paste raw multi-reviewer notes and Claude synthesizes a structured
          1-on-1 coaching rubric — streamed live over SSE with Zod-enforced
          schema contracts via tool use.
        </p>
      </header>

      {/* Wizard stepper */}
      <nav className="mb-10 flex items-center gap-2 sm:gap-4">
        {STEPS.map(({ id, label, icon: Icon }, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition',
                  done &&
                    'border-emerald-500/50 bg-emerald-500/15 text-emerald-400',
                  active &&
                    'border-cyan-500/60 bg-cyan-500/15 text-cyan-300',
                  !done && !active && 'border-slate-700 text-slate-500',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active && id === 'synthesizing' && 'animate-spin',
                    )}
                  />
                )}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  active ? 'text-slate-100' : 'text-slate-500',
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    'h-px flex-1',
                    done ? 'bg-emerald-500/40' : 'bg-slate-800',
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>

      {error && step !== 'synthesizing' && (
        <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {step === 'input' && (
        <FeedbackInputForm onSubmit={runSynthesis} />
      )}

      {step === 'synthesizing' && (
        <StreamingSynthesisView
          partial={partialJson}
          error={error}
          complete={result !== null}
          onCancel={handleStartOver}
        />
      )}

      {step === 'review' && result && input && (
        <ManagerReviewDashboard
          data={result}
          meta={input}
          onChange={setResult}
          onRegenerate={handleRegenerate}
          onStartOver={handleStartOver}
        />
      )}

      <footer className="mt-16 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
        Next.js 14 · Claude tool use · Zod schema enforcement · SSE streaming
      </footer>
    </main>
  );
}
