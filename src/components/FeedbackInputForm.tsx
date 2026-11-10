'use client';

import { FormEvent, useState } from 'react';
import { Plus, Sparkles, Trash2, UserRound, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEPARTMENT_OPTIONS,
  ROLE_OPTIONS,
  SAMPLE_FEEDBACK,
} from '@/lib/sample-feedback';
import {
  DesiredToneSchema,
  type DesiredTone,
  type FeedbackInput,
} from '@/types/feedback';

const TONE_DESCRIPTIONS: Record<DesiredTone, string> = {
  Direct: 'Crisp, no softening',
  Empathetic: 'Warm, trust-first',
  Executive: 'Terse, outcome-focused',
  Growth_Oriented: 'Framed as development opportunity',
};

interface Props {
  onSubmit: (payload: FeedbackInput) => void;
}

const inputClasses =
  'w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40';

export default function FeedbackInputForm({ onSubmit }: Props) {
  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState<string>(ROLE_OPTIONS[1]);
  const [department, setDepartment] = useState<string>(DEPARTMENT_OPTIONS[0]);
  const [desiredTone, setDesiredTone] = useState<DesiredTone>('Growth_Oriented');
  const [notes, setNotes] = useState<string[]>(['']);
  const [validationError, setValidationError] = useState<string | null>(null);

  const setNote = (index: number, value: string) =>
    setNotes((prev) => prev.map((n, i) => (i === index ? value : n)));

  const removeNote = (index: number) =>
    setNotes((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );

  const loadSample = () => {
    setEmployeeName(SAMPLE_FEEDBACK.employeeName);
    setRole(SAMPLE_FEEDBACK.role);
    setDepartment(SAMPLE_FEEDBACK.department);
    setDesiredTone(SAMPLE_FEEDBACK.desiredTone);
    setNotes([...SAMPLE_FEEDBACK.peerFeedbackNotes]);
    setValidationError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = notes.map((n) => n.trim()).filter(Boolean);
    if (!employeeName.trim()) {
      setValidationError('Employee name is required.');
      return;
    }
    if (cleaned.length === 0) {
      setValidationError('Add at least one peer feedback note.');
      return;
    }
    setValidationError(null);
    onSubmit({
      employeeName: employeeName.trim(),
      role,
      department,
      desiredTone,
      peerFeedbackNotes: cleaned,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <UserRound className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-100">
            Review Subject
          </h2>
        </div>
        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:border-indigo-400/60 hover:bg-indigo-500/20"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Load sample feedback
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Employee name
          </span>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g. Jordan Alvarez"
            className={inputClasses}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Role
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClasses}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Department
          </span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClasses}
          >
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Coaching tone
          </span>
          <select
            value={desiredTone}
            onChange={(e) =>
              setDesiredTone(DesiredToneSchema.parse(e.target.value))
            }
            className={inputClasses}
          >
            {DesiredToneSchema.options.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')} — {TONE_DESCRIPTIONS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Raw peer feedback notes
          </h3>
          <span className="text-xs text-slate-500">
            {notes.filter((n) => n.trim()).length} reviewer
            {notes.filter((n) => n.trim()).length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="space-y-4">
          {notes.map((note, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                  Reviewer {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeNote(i)}
                  disabled={notes.length === 1}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`Remove reviewer ${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(i, e.target.value)}
                rows={5}
                placeholder="Paste raw, unstructured feedback from this reviewer — bullet fragments, Slack messages, freeform notes…"
                className={cn(inputClasses, 'resize-y leading-relaxed')}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setNotes((prev) => [...prev, ''])}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-cyan-500/50 hover:text-cyan-300"
        >
          <Plus className="h-4 w-4" />
          Add another reviewer
        </button>
      </div>

      {validationError && (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          {validationError}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Sparkles className="h-4 w-4" />
          Synthesize coaching rubric
        </button>
      </div>
    </form>
  );
}
