import type { Metadata } from 'next';
import { LegalDoc } from '@/components/legal/legal-doc';
import { getDictionary } from '@/i18n/get-dictionary';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';
import { translate } from '@/i18n/translate';
import { buildMetadata } from '@/lib/seo';

type LegalDocKey = 'privacy' | 'terms' | 'responsibleGaming' | 'cookies' | 'geoRestricted';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function buildLegalMetadata(
  { params }: LocalePageProps,
  key: LegalDocKey,
  path: string,
): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);
  const doc = dictionary.legal[key];

  return buildMetadata({
    title: doc.title,
    description: 'description' in doc ? doc.description : doc.intro,
    path,
    locale,
    noindex: key === 'geoRestricted',
  });
}

export async function LegalPage({ params, docKey }: LocalePageProps & { docKey: LegalDocKey }) {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);
  const common = dictionary.legal.common;
  const doc = dictionary.legal[docKey];

  return (
    <LegalDoc
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      lastUpdatedLabel={translate(dictionary, 'legal.common.lastUpdated', { date: doc.updated })}
      placeholder={common.placeholder}
      tabs={common.tabs.map((tab) => ({ ...tab, href: localizePath(tab.href, locale) }))}
    />
  );
}
