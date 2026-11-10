import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Feedback Synthesizer | Performance Coaching Rubrics',
  description:
    'Ingest unstructured multi-reviewer peer feedback and stream structured 1-on-1 coaching rubrics — Claude tool use with Zod schema enforcement over SSE.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <div className="bg-mesh fixed inset-0 -z-10" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
