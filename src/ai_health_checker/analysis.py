import pandas as pd


def generate_monthly_summary(df: pd.DataFrame) -> list[str]:
    summaries = []

    for (year, month), group in df.groupby([df["date"].dt.year, df["date"].dt.month]):
        avg_overtime = group["overtime_min_calculated"].mean()
        avg_fatigue = group["fatigue"].mean()
        correlation = group["fatigue"].corr(group["overtime_min_calculated"])

        text = (
            f"{year}年{month}月："
            f"平均残業{avg_overtime:.2f}分、"
            f"平均疲労度{avg_fatigue:.2f}。"
            f"残業と疲労の相関は{correlation:.2f}で"
            f"{interpret_correlation(correlation)}。"
        )

        summaries.append(text)

    return summaries


def interpret_correlation(value: float | None) -> str:
    if value is None:
        return "相関を計算できません"

    abs_val = abs(value)

    if abs_val < 0.2:
        return "ほとんど相関は見られません"
    elif abs_val < 0.5:
        return "弱い正の相関" if value > 0 else "弱い負の相関"
    else:
        return "強い正の相関" if value > 0 else "強い負の相関"
