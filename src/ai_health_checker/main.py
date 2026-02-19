import pandas as pd

file_path = "data/report_2023.xlsx"
xls = pd.ExcelFile(file_path)
sheet_names = [s for s in xls.sheet_names if s != "リストマスタ"]

# 日本語 → 英語変換
column_map = {
    "日付": "date",
    "朝の気分": "morning_condition",
    "始業": "work_start",
    "終業": "work_end",
    "残業(min)": "overtime_min",
    "残業点": "overtime_score",
    "仕事終わり気分": "after_work_mood",
    "疲れ度": "fatigue",
    "コメント": "comment",
    "内容": "content",
}

WORK_MINUTES = 9 * 60

def load_and_clean_sheet(file_path, sheet_name):
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=1)
    # Unnamed削除
    df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
    # 日本語 → 英語変換
    df = df.rename(columns=column_map)
    
    # 勤務開始時間と勤務終了時間をdatetimeに変換
    df["work_start"] = pd.to_datetime(df["work_start"], format="%H:%M:%S")
    df["work_end"] = pd.to_datetime(df["work_end"], format="%H:%M:%S")
    
    # 残業時間を再計算する
    df["work_duration_min"] = (
        (df["work_end"] - df["work_start"]).dt.total_seconds() / 60
    )
    df["overtime_min_calculated"] = df["work_duration_min"] - WORK_MINUTES
    return df


all_dfs = [load_and_clean_sheet(file_path, s) for s in sheet_names]

combined_df = pd.concat(all_dfs, ignore_index=True)

print(combined_df.head())
print(combined_df.dtypes)