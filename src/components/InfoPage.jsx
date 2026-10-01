import { useEffect } from 'react';

// Shared layout for static content pages (Privacy, Terms, Help, Contact).
export default function InfoPage({ title, subtitle, updated, children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = `${title} · CineLookUp`;
    return () => {
      document.title = prev;
    };
  }, [title]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-wide">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink/60">{subtitle}</p>}
      {updated && <p className="mt-1 text-xs text-ink/40">Last updated: {updated}</p>}
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink/70">{children}</div>
    </section>
  );
}