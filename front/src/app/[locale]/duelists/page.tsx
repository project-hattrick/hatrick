import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageShell } from '@/components/common/page-shell';
import { DuelistsHero } from '@/components/duelists/duelists-hero';
import { DuelistsDirectory } from '@/components/duelists/duelists-directory';
import { getDictionary } from '@/i18n/get-dictionary';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);

  return buildMetadata({
    title: dictionary.pages.duelists.metadata.title,
    description: dictionary.pages.duelists.metadata.description,
    path: '/duelists',
    locale,
  });
}

/** Server component: exports metadata, delegates interactive grid to DuelistsDirectory. */
export default async function DuelistsPage({ params }: LocalePageProps) {
  const locale = resolveLocale((await params).locale);
  const copy = getDictionary(locale).pages.duelists;

  return (
    <PageShell>
      <DuelistsHero title={copy.title} intro={copy.intro} />
      <DuelistsDirectory />
    </PageShell>
  );
}
