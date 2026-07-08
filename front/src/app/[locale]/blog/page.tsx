import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata, SITE } from '@/lib/seo';
// NOTE: @/lib/blog does not exist yet — being built by the infra owner in parallel.
// This import will be unresolved until that module lands; the page is correct once it does.
import { getAllPosts } from '@/lib/blog';

export const metadata = buildMetadata({
  title: 'Blog',
  description:
    'Guides, deep-dives and product updates from the Hat-trick team — Live Mode, Fantasy duels, TxLINE real-time data and more.',
  path: '/blog',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: `${SITE.name} Blog`,
  description: 'Guides, deep-dives and product updates from the Hat-trick team.',
  url: `${SITE.url}/blog`,
  publisher: {
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <header className="mb-10 flex flex-col gap-3">
          <span className="text-eyebrow text-neon">Blog</span>
          <h1 className="text-display text-foreground">Stories from the pitch</h1>
          <p className="text-sm text-muted-foreground">
            Guides, deep-dives and product updates from the {SITE.name} team.
          </p>
        </header>

        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet — check back soon.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
            >
              <GlassPanel
                tone="surface"
                className="flex h-full flex-col gap-3 p-5 transition group-hover:border-neon/30"
              >
                <span className="text-eyebrow text-neon">{post.meta.tag}</span>
                <h2 className="text-sm font-bold leading-snug text-foreground group-hover:text-neon transition-colors">
                  {post.meta.title}
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {post.meta.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                  <time dateTime={post.meta.date}>
                    {new Date(post.meta.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  {post.meta.readingMinutes && (
                    <span>{post.meta.readingMinutes} min read</span>
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
