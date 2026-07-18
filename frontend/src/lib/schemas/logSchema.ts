import { z } from "zod";

export const logFormSchema = z
  .object({
    date: z.string().min(1, "日付を入力してください"),
    is_holiday: z.boolean(),
    /** 朝のみモード: 朝の時点で分かる項目だけ入力し、残りは後から追記する（#94） */
    morning_only: z.boolean(),
    mood_morning: z.number().int().min(-5).max(5),
    mood_after_work: z.number().int().min(-5).max(5).nullable(),
    fatigue: z.number().int().min(1).max(5),
    comment: z.string(),
    work_content: z.string(),
    work_start: z.string(),
    work_end: z.string(),
    gym: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_holiday) {
      if (!data.work_start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "開始時刻を入力してください",
          path: ["work_start"],
        });
      }
      if (!data.morning_only && !data.work_end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "終了時刻を入力してください",
          path: ["work_end"],
        });
      }
    }
    // 1日の終わりの気分は休日も記録する（朝のみモードでは後から追記）
    if (!data.morning_only && data.mood_after_work === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "1日の終わりの気分を入力してください",
        path: ["mood_after_work"],
      });
    }
  });

export type LogFormValues = z.infer<typeof logFormSchema>;
