from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = Path(__file__).resolve().parent
# Pointing to the new 15-year numerical dataset
DATA_PATH = BASE_DIR / "data" / "enhanced_healthcare_dataset.csv"
MODEL_PATH = BASE_DIR / "data" / "budget_model.pkl"
METADATA_PATH = BASE_DIR / "data" / "budget_model_metadata.pkl"

def train_and_save_model() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    # These are the exact 6 features your FastAPI endpoint expects
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

    print(f"Step 1: Loading 15-Year Numerical Healthcare Dataset...")
    print(f"Step 2: Training AI on {len(df)} records using features: {feature_columns}")
    
    # Optimized for 15-year historical trend analysis
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
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
        "note": "Trained on 15-year numerical historical data.",
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(metadata, METADATA_PATH)

    print(f"✅ Success! Upgraded ML Model saved to {MODEL_PATH}")
    print(f"✅ Metadata saved to {METADATA_PATH}")

if __name__ == "__main__":
    train_and_save_model()