import { createElement, ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * SWR のキャッシュをテストごとに分離するための renderHook 用 wrapper。
 * マウントごとに新しいキャッシュを生成し、重複排除とエラーリトライを無効化する。
 */
export function swrWrapper({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    {
      value: {
        provider: () => new Map(),
        dedupingInterval: 0,
        shouldRetryOnError: false,
      },
    },
    children
  );
}
