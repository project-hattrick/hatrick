import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata } from '@/lib/seo';
import { AccordionItem } from '@/components/common/accordion-item';
import { getDictionary } from '@/i18n/get-dictionary';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

const categoryOrder = ['General', 'Live', 'Fantasy', 'Account', 'Technical'] as const;

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);

  return buildMetadata({
    title: dictionary.faq.metadata.title,
    description: dictionary.faq.metadata.description,
    path: '/faq',
    locale,
  });
}

export default async function FaqPage({ params }: LocalePageProps) {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.faq;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <header className="mb-10 flex flex-col gap-3">
          <span className="text-eyebrow text-neon">{copy.eyebrow}</span>
          <h1 className="text-display text-foreground">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">
            {copy.introPrefix}{' '}
            <Link href={localizePath('/contact', locale)} className="text-neon underline-offset-4 hover:underline">
              {copy.contact}
            </Link>
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {categoryOrder.map((category) => {
            const items = copy.items.filter((item) => item.category === category);
            if (items.length === 0) return null;

            return (
              <section key={category} aria-labelledby={`faq-${category}`}>
                <h2 id={`faq-${category}`} className="text-eyebrow mb-3 text-muted-foreground">
                  {copy.categories[category]}
                </h2>
                <GlassPanel tone="surface" className="px-4">
                  {items.map((item) => (
                    <AccordionItem key={item.q} question={item.q} answer={item.a} />
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
