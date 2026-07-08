import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageShell } from '@/components/common/page-shell';
import { buildMetadata, SITE } from '@/lib/seo';
// NOTE: @/lib/blog does not exist yet — being built by the infra owner in parallel.
// This import will be unresolved until that module lands; the page is correct once it does.
import { getPostBySlug, getAllPosts } from '@/lib/blog';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return buildMetadata({
    title: post.meta.title,
    description: post.meta.description,
    path: `/blog/${slug}`,
    image: post.meta.cover,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const { meta, Content } = post;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    url: `${SITE.url}/blog/${slug}`,
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    ...(meta.cover ? { image: meta.cover } : {}),
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        {/* Article header */}
        <header className="mb-8 flex flex-col gap-3 border-b border-border/50 pb-8">
          <span className="text-eyebrow text-neon">{meta.tag}</span>
          <h1 className="text-display text-foreground">{meta.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
            <time dateTime={meta.date}>
              {new Date(meta.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {meta.readingMinutes && <span>{meta.readingMinutes} min read</span>}
          </div>
        </header>

        {/* MDX content — prose wrapper for typography */}
        <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-neon prose-a:underline-offset-4 prose-strong:text-foreground prose-code:text-neon prose-code:bg-surface-2 prose-code:rounded prose-code:px-1 prose-li:text-muted-foreground prose-hr:border-border/50">
          <Content />
        </div>

        {/* Back link */}
        <footer className="mt-12 border-t border-border/50 pt-6">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-neon hover:underline"
          >
            ← Back to Blog
          </Link>
        </footer>
      </article>
    </PageShell>
  );
}
