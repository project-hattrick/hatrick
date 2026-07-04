// Augments @types/mdx's `*.mdx` module with the `frontmatter` export produced by
// remark-mdx-frontmatter. Only the named export is declared here so it MERGES with
// @types/mdx (which already declares the default component export) without clashing.
declare module '*.mdx' {
  export const frontmatter: Record<string, unknown>;
}
