import Link from "next/link";
import type { ReactNode } from "react";

type Section = { heading: string; body: string };

export function LegalPage({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: Section[];
}) {
  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] text-[#0A0F1E]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 text-[14px] text-ink-muted transition hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to sign in
        </Link>

        <h1 className="mt-6 font-heading text-[28px] font-bold tracking-tight text-[#0A0F1E]">
          {title}
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">{lastUpdated}</p>

        <div className="mt-8 space-y-7">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-heading text-[18px] font-bold text-[#0A0F1E]">
                {s.heading}
              </h2>
              <p
                className="mt-2 font-sans text-[16px] text-[#0A0F1E]"
                style={{ lineHeight: 1.7 }}
              >
                {renderBody(s.body)}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

// Substitute markdown-style mailto links in the source text for
// real <a> tags so the content can be authored as a plain string.
function renderBody(body: string): ReactNode[] {
  const re = /\[([^\]]+)\]\((mailto:[^)]+)\)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push(body.slice(last, m.index));
    out.push(
      <a
        key={out.length}
        href={m[2]}
        className="text-brand underline-offset-2 hover:underline"
      >
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push(body.slice(last));
  return out;
}
