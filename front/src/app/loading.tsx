/** Route transition fallback — a centered brand spinner. */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-neon" />
        <span className="text-xs">Loading…</span>
      </div>
    </div>
  );
}
