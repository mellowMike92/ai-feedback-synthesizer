import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  FeedbackInputSchema,
  SynthesizedFeedbackSchema,
  type FeedbackInput,
  type SynthesisStreamEvent,
} from '@/types/feedback';
import { buildMockSynthesis } from '@/lib/mock-synthesis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';

const TOOL_NAME = 'submit_synthesized_feedback';

const SYSTEM_PROMPT = `You are an executive HR talent lead and performance coach with 20 years of experience turning raw 360-degree peer feedback into actionable 1-on-1 coaching rubrics for engineering managers.

Your job: synthesize the provided peer feedback notes into a structured coaching rubric by calling the ${TOOL_NAME} tool.

Rules:
- Ground every strength and growth area in specific evidence from the notes. Never invent facts, incidents, or metrics.
- Synthesize across reviewers: call out convergent themes, not one-off comments. If reviewers disagree, note the tension.
- Write growth areas constructively — observable behavior + impact, never character judgments.
- Produce exactly 3 actionable goals spanning 30/60/90 days, each with a concrete, measurable metric.
- Coaching talking points must be phrased as questions or prompts a manager can literally say in a 1:1 (4-6 items).
- Match the requested coaching tone: Direct (crisp, no softening), Empathetic (warm, trust-first), Executive (terse, outcome-focused), Growth_Oriented (framed as development opportunity).`;

function buildUserPrompt(input: FeedbackInput): string {
  const notes = input.peerFeedbackNotes
    .map((n, i) => `--- Reviewer ${i + 1} ---\n${n.trim()}`)
    .join('\n\n');
  return `Employee: ${input.employeeName}
Role: ${input.role}
Department: ${input.department}
Desired coaching tone: ${input.desiredTone}

Peer feedback notes (${input.peerFeedbackNotes.length} reviewers):

${notes}

Call ${TOOL_NAME} with the synthesized coaching rubric.`;
}

// Derive the Anthropic tool input_schema directly from the Zod output schema so
// the enforced contract can never drift from the validation contract.
function toolInputSchema(): Anthropic.Tool.InputSchema {
  const { $schema: _drop, ...schema } = z.toJSONSchema(
    SynthesizedFeedbackSchema,
  ) as Record<string, unknown>;
  return schema as Anthropic.Tool.InputSchema;
}

async function* mockDeltaStream(
  input: FeedbackInput,
): AsyncGenerator<SynthesisStreamEvent> {
  const payload = buildMockSynthesis(input);
  const json = JSON.stringify(payload);
  const CHUNK = 56;
  for (let i = 0; i < json.length; i += CHUNK) {
    yield { type: 'delta', partial: json.slice(0, i + CHUNK) };
    await new Promise((r) => setTimeout(r, 18));
  }
  yield { type: 'result', payload };
}

async function* anthropicDeltaStream(
  input: FeedbackInput,
): AsyncGenerator<SynthesisStreamEvent> {
  const client = new Anthropic();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description:
          'Submit the synthesized performance coaching rubric. Call this exactly once with the complete structured result.',
        input_schema: toolInputSchema(),
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  });

  let partial = '';
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'input_json_delta'
    ) {
      partial += event.delta.partial_json;
      yield { type: 'delta', partial };
    }
  }

  const finalMessage = await stream.finalMessage();
  const toolUse = finalMessage.content.find((b) => b.type === 'tool_use');
  const parsed = SynthesizedFeedbackSchema.safeParse(toolUse?.input);
  if (!parsed.success) {
    yield {
      type: 'error',
      message: `Model output failed schema validation: ${parsed.error.issues
        .map((i) => i.path.join('.') + ' ' + i.message)
        .join('; ')}`,
    };
    return;
  }
  yield { type: 'result', payload: parsed.data };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const parsed = FeedbackInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const encoder = new TextEncoder();
  const useMock = !process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SynthesisStreamEvent) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      try {
        send({ type: 'status', phase: 'connecting' });
        const events = useMock
          ? mockDeltaStream(input)
          : anthropicDeltaStream(input);
        send({ type: 'status', phase: 'streaming' });
        for await (const event of events) {
          send(event);
        }
      } catch (err) {
        send({
          type: 'error',
          message:
            err instanceof Error ? err.message : 'Synthesis stream failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
