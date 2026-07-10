/** 同じ日付のログが既に存在する場合（バックエンドの409）を表すエラー */
export class DuplicateDateError extends Error {
  constructor() {
    super("A log with the same date already exists");
    this.name = "DuplicateDateError";
  }
}
