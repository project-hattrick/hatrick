import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Geist_Mono } from 'next/font/google';
import '../globals.css';
import 'flag-icons/css/flag-icons.min.css';
import { talero } from '@/lib/fonts';
import { AppProviders } from '@/providers/app-providers';
import { Toaster } from '@/components/ui/sonner';
import { CookieNotice } from '@/components/common/cookie-notice';
import { AgeGate } from '@/components/common/age-gate';
import { SmoothScroll } from '@/components/common/smooth-scroll';
import { SITE } from '@/lib/seo';
import { JsonLd, siteJsonLd } from '@/components/common/json-ld';
import { getDictionary } from '@/i18n/get-dictionary';
import { localeLabels, locales, isLocale, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function assertLocale(locale: string): asserts locale is Locale {
  if (!isLocale(locale)) notFound();
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const dictionary = getDictionary(locale);

  return {
    metadataBase: new URL(SITE.url),
    title: { default: dictionary.home.site.title, template: `%s · ${SITE.name}` },
    description: dictionary.home.site.description,
    applicationName: SITE.name,
    keywords: [...SITE.keywords],
    authors: [{ name: SITE.name }],
    creator: SITE.name,
    alternates: {
      canonical: localizePath('/', locale),
      languages: Object.fromEntries(locales.map((value) => [value, localizePath('/', value)])),
    },
    robots: { index: true, follow: true },
    icons: { icon: '/logo.png', apple: '/logo.png' },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: dictionary.home.site.title,
      description: dictionary.home.site.description,
      url: new URL(localizePath('/', locale), SITE.url).toString(),
      locale: localeLabels[locale].ogLocale,
      alternateLocale: locales.filter((value) => value !== locale).map((value) => localeLabels[value].ogLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title: dictionary.home.site.title,
      description: dictionary.home.site.description,
      site: SITE.twitter,
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  assertLocale(locale);
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`dark ${inter.variable} ${geistMono.variable} ${talero.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={siteJsonLd} />
        <SmoothScroll>
          <AppProviders locale={locale} dictionary={dictionary}>
            <main className="flex flex-1 flex-col">{children}</main>
            <CookieNotice />
            <AgeGate />
            <Toaster />
          </AppProviders>
        </SmoothScroll>
      </body>
    </html>
  );
}
