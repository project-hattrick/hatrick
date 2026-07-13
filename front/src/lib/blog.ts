import type { ComponentType } from 'react';

import * as whatIsHatTrick from '../../content/blog/what-is-hat-trick.mdx';
import * as liveVsFantasy from '../../content/blog/live-vs-fantasy.mdx';
import * as txlineRealTime from '../../content/blog/txline-real-time.mdx';
import * as duelsExplained from '../../content/blog/1v1-duels-explained.mdx';
import * as responsibleGaming from '../../content/blog/responsible-gaming.mdx';
import * as buildingFantasyXi from '../../content/blog/building-your-fantasy-xi.mdx';
import * as readingLiveOdds from '../../content/blog/reading-live-odds.mdx';
import * as worldCup2026Guide from '../../content/blog/world-cup-2026-guide.mdx';

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date string. */
  date: string;
  tag: string;
  cover?: string;
  readingMinutes: number;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  Content: ComponentType;
}

interface BlogModule {
  default: ComponentType;
  frontmatter?: Record<string, unknown>;
}

/** Slug → compiled MDX module. Add a post by dropping a file in content/blog and registering it here. */
const MODULES: Record<string, BlogModule> = {
  'what-is-hat-trick': whatIsHatTrick as unknown as BlogModule,
  'live-vs-fantasy': liveVsFantasy as unknown as BlogModule,
  'txline-real-time': txlineRealTime as unknown as BlogModule,
  '1v1-duels-explained': duelsExplained as unknown as BlogModule,
  'responsible-gaming': responsibleGaming as unknown as BlogModule,
  'building-your-fantasy-xi': buildingFantasyXi as unknown as BlogModule,
  'reading-live-odds': readingLiveOdds as unknown as BlogModule,
  'world-cup-2026-guide': worldCup2026Guide as unknown as BlogModule,
};

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const toPost = (slug: string, mod: BlogModule): Post => {
  const fm = mod.frontmatter ?? {};
  const meta: PostMeta = {
    slug,
    title: str(fm.title, slug),
    description: str(fm.description),
    date: str(fm.date, '2026-07-01'),
    tag: str(fm.tag, 'Update'),
    cover: typeof fm.cover === 'string' ? fm.cover : undefined,
    readingMinutes: typeof fm.readingMinutes === 'number' ? fm.readingMinutes : 3,
  };
  return { slug, meta, Content: mod.default };
};

/** All posts, newest first. */
export function getAllPosts(): Post[] {
  return Object.entries(MODULES)
    .map(([slug, mod]) => toPost(slug, mod))
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const mod = MODULES[slug];
  return mod ? toPost(slug, mod) : null;
}

export function getAllPostSlugs(): string[] {
  return Object.keys(MODULES);
}
