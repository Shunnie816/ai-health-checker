"use client";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function Toggle({ checked, onChange }: Props) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-border"}`}
    >
      <div
        className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-[left] duration-[180ms]"
        style={{ left: checked ? "23px" : "3px" }}
      />
    </div>
  );
}
