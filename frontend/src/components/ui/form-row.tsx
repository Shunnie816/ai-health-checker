type Props = {
  label: string;
  children: React.ReactNode;
};

export function FormRow({ label, children }: Props) {
  return (
    <div className="flex items-center justify-between px-4">
      <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
      {children}
    </div>
  );
}

export function Divider() {
  return <div className="mx-[-1rem] h-px bg-[var(--color-border)]" />;
}
