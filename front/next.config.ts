import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Let App Router treat .mdx as routable/importable alongside ts/tsx.
  pageExtensions: ["ts", "tsx", "mdx"],
};

// Turbopack (default in Next 16) needs remark/rehype plugins as string names.
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      ["remark-frontmatter"],
      ["remark-mdx-frontmatter", { name: "frontmatter" }],
      ["remark-gfm"],
    ],
  },
});

export default withMDX(nextConfig);
