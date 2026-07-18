"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** 破壊的操作は danger、それ以外は primary */
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

/** 確認用ダイアログ（削除・ログアウトなど、誤タップを防ぎたい操作に使う）。
 * モバイルではボトムシート、PC幅（lg以上）では中央のモーダルとして表示する（#117） */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40 lg:items-center lg:justify-center lg:p-4">
      <div className="mx-auto w-full max-w-lg rounded-t-2xl bg-canvas px-5 pb-10 pt-3 shadow-overlay lg:max-w-sm lg:rounded-2xl lg:p-6">
        {/* グラバーはボトムシート専用の意匠のため PC では出さない */}
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-border lg:hidden" />
        <h2 className="mb-1.5 text-lg font-semibold text-fg">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-fg-muted">{message}</p>
        <div className="flex flex-col gap-2.5 lg:flex-row-reverse lg:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full cursor-pointer rounded-xl py-3.5 text-base font-semibold text-white ${
              confirmVariant === "danger" ? "bg-danger" : "bg-primary"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full cursor-pointer rounded-xl border border-border bg-surface-1 py-3.5 text-base font-medium text-fg"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
