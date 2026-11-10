# ai-feedback-synthesizer

AI-powered **performance & feedback synthesizer**. Paste unstructured multi-reviewer peer feedback and the app streams a structured 1-on-1 coaching rubric to managers in real time — Claude tool use with Zod-enforced schema contracts over Server-Sent Events.

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript strict mode, `src/` layout
- **Styling:** Tailwind CSS + Lucide icons
- **LLM:** `@anthropic-ai/sdk` — Claude 3.5 Sonnet with forced `tool_choice` and `input_json_delta` streaming
- **Validation:** `zod` — single source of truth for input validation, the Anthropic tool `input_schema` (via `z.toJSONSchema`), and output validation
- **Streaming:** SSE via `ReadableStream` in a Node.js route handler (`POST /api/synthesize`)

## Quickstart

```bash
npm install
cp .env.example .env.local   # set ANTHROPIC_API_KEY for live synthesis
npm run dev                  # http://localhost:3000
npm run build                # production build
npm run lint                 # next lint
```

No API key? The route falls back to a **deterministic mock synthesis** so the
full input → streaming → review/export flow remains demoable end-to-end.
`ANTHROPIC_MODEL` overrides the default `claude-3-5-sonnet-20241022`.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FmellowMike92%2Fai-feedback-synthesizer)

Or: Vercel → *Add New → Project* → import `ai-feedback-synthesizer`. No config
needed — it detects Next.js automatically. Add `ANTHROPIC_API_KEY` in
*Settings → Environment Variables* for live Claude synthesis (without it the
app runs the deterministic mock).

## How it works

1. **Input** — `FeedbackInputSchema` validates `employeeName`, `role`, `department`, `peerFeedbackNotes[]`, and `desiredTone` (`Direct | Empathetic | Executive | Growth_Oriented`).
2. **Synthesis** — the route calls `anthropic.messages.stream` with a `submit_synthesized_feedback` tool whose `input_schema` is generated directly from `SynthesizedFeedbackSchema`, plus `tool_choice: { type: 'tool' }` so the model must emit the structured payload.
3. **Streaming** — `input_json_delta` chunks are forwarded to the browser as SSE `delta` events (live JSON in the terminal view); on completion the final `tool_use.input` is Zod-validated and sent as a `result` event.
4. **Review** — the manager dashboard renders the rubric as editable cards: executive summary, strengths (evidence + impact), growth areas (synthesis + recommendation), 30-60-90 goals with metrics, and coaching talking points. Toolbar: tone-based regenerate, copy-to-Markdown, and print → Save as PDF export.

## API contract

`POST /api/synthesize` — request body must satisfy `FeedbackInputSchema` (`400` + Zod issues otherwise). Response is `text/event-stream` with events:

```json
{"type":"status","phase":"connecting"}
{"type":"delta","partial":"{\"executiveSummary\":\"..."}   ← cumulative JSON snapshot
{"type":"result","payload":{ ...SynthesizedFeedback }}     ← Zod-validated
{"type":"error","message":"..."}
```

## Layout

```
src/
  app/
    page.tsx                    wizard shell — Input → Synthesizing → Review
    layout.tsx / globals.css    dark slate/cyan theme + print styles
    api/synthesize/route.ts     SSE route: Anthropic tool-use stream → Zod validate
  components/
    FeedbackInputForm.tsx       dynamic multi-reviewer note inputs + tone/role selects
    StreamingSynthesisView.tsx  live JSON terminal + phase checklist
    ManagerReviewDashboard.tsx  editable rubric cards, tone regen, MD/PDF export
  lib/
    mock-synthesis.ts           deterministic no-key fallback (keyword-aware)
    sample-feedback.ts          3-reviewer sample dataset + select options
    markdown.ts                 rubric → Markdown export
    utils.ts                    cn() helper
  types/
    feedback.ts                 Zod schemas, inferred types, SSE event union
```
