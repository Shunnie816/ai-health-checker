import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-1 p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
