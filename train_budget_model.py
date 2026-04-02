from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


BASE_DIR = Path(__file__).resolve().parent
# UPDATED: Pointing to the new enhanced dataset
DATA_PATH = BASE_DIR / "data" / "enhanced_healthcare_dataset.csv"
MODEL_PATH = BASE_DIR / "data" / "budget_model.pkl"
METADATA_PATH = BASE_DIR / "data" / "budget_model_metadata.pkl"


def train_and_save_model() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    # UPDATED: We now feed the AI 6 data points per state instead of 2!
    feature_columns = [
        "Population", 
        "Health_Burden_Score",
        "Need_Index",
        "Disease_Prevalence_Index",
        "Poverty_Rate",
        "Doctors_per_1000"
    ]
    target_column = "Utilized_Budget_Cr"

    missing_columns = [c for c in feature_columns + [target_column] if c not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns in dataset: {missing_columns}")

    X = df[feature_columns].copy()
    y = df[target_column].copy()

    # Keep model small to run smoothly on low-memory machines.
    print(f"Step 1: Loading Enhanced Healthcare Dataset...")
    print(f"Step 2: Training AI on new features: {feature_columns}")
    
    model = RandomForestRegressor(
        n_estimators=80,
        max_depth=8,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X, y)

    metadata = {
        "feature_columns": feature_columns,
        "target_column": target_column,
        "model_type": "RandomForestRegressor",
        "note": "Optimal_Required_Budget_Cr is represented by Utilized_Budget_Cr.",
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(metadata, METADATA_PATH)

    print(f"Success! Upgraded Model saved to {MODEL_PATH}")
    print(f"Metadata saved: {METADATA_PATH}")


if __name__ == "__main__":
    train_and_save_model()