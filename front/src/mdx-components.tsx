import type { MDXComponents } from 'mdx/types';

/** Maps MDX elements to the landing design-system typography. Required by @next/mdx. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="text-title mt-8 mb-3 first:mt-0" {...props} />,
    h2: (props) => <h2 className="mt-8 mb-3 text-xl font-bold tracking-tight text-foreground" {...props} />,
    h3: (props) => <h3 className="mt-6 mb-2 text-lg font-semibold text-foreground" {...props} />,
    p: (props) => <p className="mb-4 leading-relaxed text-muted-foreground" {...props} />,
    ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-muted-foreground" {...props} />,
    ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-muted-foreground" {...props} />,
    li: (props) => <li className="leading-relaxed" {...props} />,
    a: (props) => <a className="text-neon underline underline-offset-4 hover:text-foreground" {...props} />,
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    blockquote: (props) => (
      <blockquote className="my-5 border-l-2 border-neon/50 pl-4 text-foreground/90 italic" {...props} />
    ),
    hr: (props) => <hr className="my-8 border-border/50" {...props} />,
    ...components,
  };
}
