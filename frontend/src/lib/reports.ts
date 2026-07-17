import { addDaysString } from "@/lib/format";

export type AnalysisReport = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  content: string;
  log_count: number;
  created_at: string;
};

export type AnalysisRunParams = {
  startDate?: string;
  endDate?: string;
};

export type AnalysisPeriodPreset = "7d" | "30d" | "90d";
export type AnalysisPeriod = AnalysisPeriodPreset | "custom";

export const ANALYSIS_PERIOD_OPTIONS: { value: AnalysisPeriod; label: string }[] = [
  { value: "7d", label: "1週間" },
  { value: "30d", label: "1か月" },
  { value: "90d", label: "3か月" },
  { value: "custom", label: "期間指定" },
];

const PRESET_DAYS: Record<AnalysisPeriodPreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * 選択された分析期間を API パラメータへ変換する。
 * プリセットは today を含む直近N日間、"custom" は指定された開始日・終了日をそのまま使う。
 */
export function analysisPeriodParams(
  period: AnalysisPeriod,
  today: string,
  custom: { startDate: string; endDate: string }
): AnalysisRunParams {
  if (period === "custom") {
    return { startDate: custom.startDate, endDate: custom.endDate };
  }
  return {
    startDate: addDaysString(today, -(PRESET_DAYS[period] - 1)),
    endDate: today,
  };
}
