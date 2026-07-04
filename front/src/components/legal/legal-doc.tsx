import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';

interface LegalSection {
  heading: string;
  body: string;
}

interface LegalDocProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const tabs = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/responsible-gaming', label: 'Responsible Gaming' },
  { href: '/legal/cookies', label: 'Cookies' },
];

/** Shared legal document layout: title, last-updated, tab switch and numbered sections. */
export function LegalDoc({ title, updated, intro, sections }: LegalDocProps) {
  return (
    <PageShell>
      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2 text-xs">
            {tabs.map((tab) => (
              <Link key={tab.href} href={tab.href} className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground transition hover:text-foreground">
                {tab.label}
              </Link>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <span className="text-xs text-muted-foreground">Last updated: {updated}</span>
          <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
        </header>

        {sections.map((section, index) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-sm font-bold tracking-wide text-foreground">
              {index + 1}. {section.heading}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}

        <p className="mt-4 text-xs text-muted-foreground/70">
          Wireframe placeholder copy — replace with reviewed legal text before launch.
        </p>
      </article>
    </PageShell>
  );
}
