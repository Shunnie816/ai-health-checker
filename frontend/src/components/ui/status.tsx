export function LoadingText() {
  return <p className="mt-12 text-center text-[var(--color-text-muted)]">読み込み中...</p>;
}

export function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-12 text-center leading-relaxed text-[var(--color-text-muted)]">{children}</p>
  );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-[var(--color-danger-subtle)] px-4 py-3 text-[13px] text-[var(--color-danger)]">
      {children}
    </p>
  );
}
