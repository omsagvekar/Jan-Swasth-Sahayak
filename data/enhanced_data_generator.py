import pandas as pd
import numpy as np

# Load your dataset
df = pd.read_csv("historical_state_budgets.csv")

np.random.seed(42)

# -----------------------------
# 1. GDP Per Capita (₹)
# -----------------------------
df["GDP_Per_Capita"] = np.random.normal(150000, 40000, len(df))
df["GDP_Per_Capita"] = df["GDP_Per_Capita"].clip(50000, 300000)

# -----------------------------
# 2. Poverty Rate (%)
# inversely related to GDP
# -----------------------------
df["Poverty_Rate"] = 40 - (df["GDP_Per_Capita"] / 10000) + np.random.normal(0, 2, len(df))
df["Poverty_Rate"] = df["Poverty_Rate"].clip(5, 45)

# -----------------------------
# 3. Hospital Beds per 1000
# -----------------------------
df["Hospital_Beds_per_1000"] = (
    1 + (df["GDP_Per_Capita"] / 200000) + np.random.normal(0, 0.3, len(df))
)
df["Hospital_Beds_per_1000"] = df["Hospital_Beds_per_1000"].clip(0.5, 5)

# -----------------------------
# 4. Doctors per 1000
# -----------------------------
df["Doctors_per_1000"] = (
    0.5 + (df["GDP_Per_Capita"] / 300000) + np.random.normal(0, 0.2, len(df))
)
df["Doctors_per_1000"] = df["Doctors_per_1000"].clip(0.2, 3)

# -----------------------------
# 5. Infant Mortality Rate
# higher if poverty + health burden is high
# -----------------------------
df["Infant_Mortality_Rate"] = (
    60 - (df["GDP_Per_Capita"] / 5000)
    + (df["Health_Burden_Score"] * 0.5)
    + np.random.normal(0, 3, len(df))
)
df["Infant_Mortality_Rate"] = df["Infant_Mortality_Rate"].clip(5, 70)

# -----------------------------
# 6. Elderly Population (%)
# -----------------------------
df["Elderly_Population_Percentage"] = np.random.normal(8, 2, len(df)).clip(4, 15)

# -----------------------------
# 7. Urban Population (%)
# -----------------------------
df["Urban_Population_Percentage"] = np.random.normal(35, 10, len(df)).clip(10, 80)

# -----------------------------
# 8. Disease Prevalence Index
# tied to health burden
# -----------------------------
df["Disease_Prevalence_Index"] = (
    df["Health_Burden_Score"] * 1.2 + np.random.normal(0, 5, len(df))
)

# -----------------------------
# 9. Health Infrastructure Index
# -----------------------------
df["Health_Infra_Index"] = (
    df["Hospital_Beds_per_1000"] * 0.5 +
    df["Doctors_per_1000"] * 0.5
)

# -----------------------------
# 10. Need Index (VERY IMPORTANT)
# -----------------------------
df["Need_Index"] = (
    df["Health_Burden_Score"] * 0.4 +
    df["Poverty_Rate"] * 0.2 +
    df["Infant_Mortality_Rate"] * 0.2 +
    (1 / df["Health_Infra_Index"]) * 0.2
)

# -----------------------------
# Optional: normalize Need Index
# -----------------------------
df["Need_Index"] = (df["Need_Index"] - df["Need_Index"].min()) / (
    df["Need_Index"].max() - df["Need_Index"].min()
)

# -----------------------------
# Save new dataset
# -----------------------------
df.to_csv("enhanced_healthcare_dataset.csv", index=False)

print("✅ Enhanced dataset created: enhanced_healthcare_dataset.csv")
print(df.head())