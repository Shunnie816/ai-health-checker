export type AnalysisReport = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  content: string;
  log_count: number;
  created_at: string;
};

/** 分析対象期間にログが1件もない場合（バックエンドの404）を表すエラー */
export class NoLogsError extends Error {
  constructor() {
    super("No logs found in the analysis period");
    this.name = "NoLogsError";
  }
}
