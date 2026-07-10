import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  /** 指定すると左端に戻るボタンを表示する */
  backHref?: string;
  /** 右端に表示するボタン類 */
  actions?: React.ReactNode;
  titleClassName?: string;
};

export function PageHeader({ title, subtitle, backHref, actions, titleClassName }: Props) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 pb-3 pt-3.5">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="戻る"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-1)]"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        <div>
          <h1
            className={cn(
              "text-xl font-semibold tracking-tight text-[var(--color-text-primary)]",
              titleClassName
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
