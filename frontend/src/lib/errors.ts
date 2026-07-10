/** 同じ日付のログが既に存在する場合（バックエンドの409）を表すエラー */
export class DuplicateDateError extends Error {
  constructor() {
    super("A log with the same date already exists");
    this.name = "DuplicateDateError";
  }
}

/** 分析対象期間にログが1件もない場合（バックエンドの404）を表すエラー */
export class NoLogsError extends Error {
  constructor() {
    super("No logs found in the analysis period");
    this.name = "NoLogsError";
  }
}
