import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata, SITE } from '@/lib/seo';
import { getAllPosts } from '@/lib/blog';
import { getDictionary } from '@/i18n/get-dictionary';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';
import { translate } from '@/i18n/translate';

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
    title: dictionary.pages.blog.metadata.title,
    description: dictionary.pages.blog.metadata.description,
    path: '/blog',
    locale,
  });
}

export default async function BlogIndexPage({ params }: LocalePageProps) {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.pages.blog;
  const posts = await getAllPosts();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE.name} Blog`,
    description: copy.intro,
    url: new URL(localizePath('/blog', locale), SITE.url).toString(),
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
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
          <p className="text-sm text-muted-foreground">{copy.intro}</p>
        </header>

        {posts.length === 0 && <p className="text-sm text-muted-foreground">{copy.empty}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={localizePath(`/blog/${post.slug}`, locale)}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GlassPanel
                tone="surface"
                className="flex h-full flex-col gap-3 p-5 transition group-hover:border-neon/30"
              >
                <span className="text-eyebrow text-neon">{post.meta.tag}</span>
                <h2 className="text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-neon">
                  {post.meta.title}
                </h2>
                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.meta.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                  <time dateTime={post.meta.date}>
                    {new Date(post.meta.date).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  {post.meta.readingMinutes && (
                    <span>{translate(dictionary, 'pages.blog.readMinutes', { minutes: post.meta.readingMinutes })}</span>
                  )}
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
