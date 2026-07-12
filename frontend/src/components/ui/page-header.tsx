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
  /** PC でのコンテンツ幅。ページ本文のコンテナ幅と揃える */
  containerClassName?: string;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  actions,
  titleClassName,
  containerClassName = "max-w-lg",
}: Props) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-canvas px-5 pb-3 pt-3.5">
      <div className={cn("mx-auto flex w-full items-center justify-between", containerClassName)}>
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label="戻る"
              className="flex h-8 w-8 items-center justify-center rounded-full text-fg-secondary transition-colors hover:bg-surface-1"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          <div>
            <h1
              className={cn(
                "text-xl font-semibold tracking-tight text-fg",
                titleClassName
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
