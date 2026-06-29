interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/** Centered eyebrow + title + optional description for a landing section. */
function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-12 flex flex-col items-center gap-3 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-2 px-3 py-1 text-[11px] font-bold tracking-wider text-neon uppercase">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export { SectionHeading };
