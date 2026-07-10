"use client";

import { useEffect, useMemo, useState } from "react";

export type DuplicateGuardLog = { id: string; date: string };

export type DuplicateGuardApi = {
  listLogs: () => Promise<DuplicateGuardLog[]>;
};

// api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
// レンダーごとに新しいオブジェクトを渡すと一覧取得の effect が毎回再実行される。
/**
 * 指定日付のログが既に存在するか調べ、あればその id を返す（新規記録画面用）。
 * 取得失敗時は null のまま（最終的な重複防止はバックエンドの409が担保する）。
 */
export function useDuplicateDateGuard(
  date: string,
  enabled: boolean,
  api: DuplicateGuardApi
): string | null {
  const [logs, setLogs] = useState<DuplicateGuardLog[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    api
      .listLogs()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        // 取得失敗時はガードなし（バックエンド側の409で防止される）
      });
    return () => {
      cancelled = true;
    };
  }, [api, enabled]);

  return useMemo(
    () => logs.find((log) => log.date === date)?.id ?? null,
    [logs, date]
  );
}
