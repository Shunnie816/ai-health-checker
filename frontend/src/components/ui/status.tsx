export function LoadingText() {
  return <p className="mt-12 text-center text-fg-muted">読み込み中...</p>;
}

export function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-12 text-center leading-relaxed text-fg-muted">{children}</p>
  );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-danger-subtle px-4 py-3 text-sm text-danger">
      {children}
    </p>
  );
}
