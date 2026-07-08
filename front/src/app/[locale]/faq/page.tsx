import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata, SITE } from '@/lib/seo';
import { faqItems, FAQ_CATEGORY_ORDER } from '@/config/faq.config';
import { AccordionItem } from '@/components/common/accordion-item';

export const metadata = buildMetadata({
  title: 'FAQ',
  description:
    'Answers to the most common questions about Hat-trick — Live Mode, Fantasy duels, wallets, and the TxLINE feed.',
  path: '/faq',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <header className="mb-10 flex flex-col gap-3">
          <span className="text-eyebrow text-neon">Help Center</span>
          <h1 className="text-display text-foreground">Frequently Asked Questions</h1>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about {SITE.name}. Can&apos;t find your answer?{' '}
            <Link href="/contact" className="text-neon underline-offset-4 hover:underline">
              Contact us.
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {FAQ_CATEGORY_ORDER.map((category) => {
            const items = faqItems.filter((item) => item.category === category);
            if (items.length === 0) return null;

            return (
              <section key={category} aria-labelledby={`faq-${category}`}>
                <h2
                  id={`faq-${category}`}
                  className="text-eyebrow mb-3 text-muted-foreground"
                >
                  {category}
                </h2>
                <GlassPanel tone="surface" className="px-4">
                  {items.map((item) => (
                    <AccordionItem
                      key={item.q}
                      question={item.q}
                      answer={item.a}
                    />
                  ))}
                </GlassPanel>
              </section>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
