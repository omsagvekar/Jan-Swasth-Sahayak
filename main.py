from __future__ import annotations

from pathlib import Path
from typing import Literal
import logging
from contextlib import asynccontextmanager
import os

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# NEW: Import Hugging Face's AI pipeline!
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
import json

# Configure logging to capture all issues
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(levelname)s] %(asctime)s - %(name)s - %(message)s'
)
logger = logging.getLogger("main")

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "enhanced_healthcare_dataset.csv"
MODEL_PATH = BASE_DIR / "data" / "budget_model.pkl"

# NEW: Pointing FastAPI to your extracted custom AI folder
SLM_MODEL_PATH = BASE_DIR / "my_local_slm"

# ============================================================================
# PYDANTIC MODELS - Defined first to avoid forward reference issues
# ============================================================================

class StateInput(BaseModel):
    state: str = Field(..., min_length=2)
    population: float = Field(..., gt=0)
    health_burden_score: float = Field(..., ge=0, le=100)
    need_index: float
    disease_prevalence_index: float
    poverty_rate: float
    doctors_per_1000: float

class AllocateFundsRequest(BaseModel):
    total_national_budget: float = Field(..., gt=0)
    states: list[StateInput] = Field(..., min_length=1)

class AllocationRow(BaseModel):
    state: str
    population: float
    health_burden_score: float
    predicted_optimal_required_budget_cr: float
    allocated_budget_cr: float
    allocation_share_percentage: float
    status: str

class AllocateFundsResponse(BaseModel):
    total_national_budget: float
    total_predicted_national_need_cr: float
    national_reserve_fund: float
    allocations: list[AllocationRow]

class ExplainAllocationRequest(BaseModel):
    state: str
    ml_allocated_budget_cr: float
    health_burden_score: float
    need_index: float
    poverty_rate: float
    doctors_per_1000: float
    question: str

class ExplainAllocationResponse(BaseModel):
    state: str
    explanation: str
    model: str

class StateHealthInput(BaseModel):
    state: str
    population: int
    health_burden_score: float
    need_index: float
    disease_prevalence_index: float
    poverty_rate: float
    doctors_per_1000: float
    source_year: int

class StateHealthInputsResponse(BaseModel):
    source: Literal["enhanced_healthcare_dataset.csv"]
    states: list[StateHealthInput]

# ============================================================================
# GLOBAL VARIABLES
# ============================================================================

budget_model = None
latest_state_inputs: list[StateHealthInput] = []
custom_ai_pipeline = None  # NEW: The variable to hold your AI in memory

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _load_latest_state_inputs() -> list[StateHealthInput]:
    """Load the latest year state health inputs from CSV."""
    if not DATA_PATH.exists():
        logger.error(f"Data file not found at {DATA_PATH}")
        return []

    try:
        df = pd.read_csv(DATA_PATH)
        required = ["Year", "State", "Population", "Health_Burden_Score", "Need_Index", "Disease_Prevalence_Index", "Poverty_Rate", "Doctors_per_1000"]
        if any(col not in df.columns for col in required):
            logger.error("Missing columns in dataset!")
            return []

        max_year = int(df["Year"].max())
        current_df = (
            df[df["Year"] == max_year][required]
            .drop_duplicates(subset=["State"])
            .sort_values("State")
        )

        results = [
            StateHealthInput(
                state=row["State"],
                population=int(row["Population"]),
                health_burden_score=float(row["Health_Burden_Score"]),
                need_index=float(row["Need_Index"]),
                disease_prevalence_index=float(row["Disease_Prevalence_Index"]),
                poverty_rate=float(row["Poverty_Rate"]),
                doctors_per_1000=float(row["Doctors_per_1000"]),
                source_year=max_year,
            )
            for _, row in current_df.iterrows()
        ]
        logger.info(f"Loaded state inputs for {len(results)} states from year {max_year}")
        return results
    except Exception as e:
        logger.exception(f"Error loading state inputs: {e}")
        return []

def _generate_fallback_explanation(payload: ExplainAllocationRequest) -> str:
    """
    Generate a text-based explanation using rule-based analysis.
    """
    allocation = payload.ml_allocated_budget_cr
    need = payload.need_index
    burden = payload.health_burden_score
    poverty = payload.poverty_rate
    doctors = payload.doctors_per_1000
    
    # Build explanation
    lines = []
    lines.append(f"Analysis for {payload.state}:")
    lines.append("")
    lines.append(f"Budget Allocation: Rs.{allocation:.2f} Crore")
    lines.append("")
    
    # Health burden analysis
    if burden >= 75:
        lines.append("- High health burden: Significant disease prevalence and mortality rates.")
    elif burden >= 50:
        lines.append("- Moderate health burden: Notable health challenges in the region.")
    else:
        lines.append("- Lower health burden: Good health outcomes relative to national average.")
    
    # Need analysis
    if need >= 0.8:
        lines.append(f"- High need index ({need:.2f}): Critical healthcare infrastructure requirements.")
    else:
        lines.append(f"- Moderate need index ({need:.2f}): Reasonable healthcare infrastructure.")
    
    # Poverty analysis
    if poverty >= 30:
        lines.append(f"- High poverty rate ({poverty:.1f}%): Significant economic vulnerability affecting healthcare access.")
    else:
        lines.append(f"- Poverty rate ({poverty:.1f}%): Moderate economic capacity for healthcare access.")
    
    # Doctor availability
    if doctors < 1:
        lines.append(f"- Low doctor availability ({doctors:.2f} per 1000): Critical shortage of medical professionals.")
    elif doctors < 2:
        lines.append(f"- Moderate doctor availability ({doctors:.2f} per 1000): Need for physician recruitment.")
    else:
        lines.append(f"- Reasonable doctor availability ({doctors:.2f} per 1000): Adequate medical workforce.")
    
    lines.append("")
    lines.append(f"Recommendation: This allocation of Rs.{allocation:.2f} Crore aims to address identified health burden while considering infrastructure gaps and socioeconomic factors.")
    
    return "\n".join(lines)

# ============================================================================
# LIFESPAN CONTEXT MANAGER
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI app startup and shutdown.
    Properly handles model loading with comprehensive error handling.
    """
    global budget_model, latest_state_inputs
    
    # ========== STARTUP ==========
    logger.info("=" * 70)
    logger.info("STARTING APPLICATION STARTUP SEQUENCE")
    logger.info("=" * 70)
    
    startup_success = False
    try:
        logger.info(f"Checking for model file at: {MODEL_PATH}")
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model file not found at {MODEL_PATH}. Run `python train_budget_model.py` first.")
        
        logger.info(f"✓ Model file exists")
        logger.info(f"Loading budget model...")
        budget_model = joblib.load(MODEL_PATH)
        logger.info(f"✓ Budget model loaded successfully (type: {type(budget_model).__name__})")
        
        logger.info(f"Loading state health inputs from: {DATA_PATH}")
        latest_state_inputs = _load_latest_state_inputs()
        logger.info(f"✓ Loaded {len(latest_state_inputs)} state health inputs")
        
        logger.info("=" * 70)
        logger.info("[OK] Budget model and health inputs loaded successfully.")
        logger.info("=" * 70)
        startup_success = True
        
    except Exception as e:
        logger.critical("=" * 70)
        logger.critical(f"STARTUP FAILED WITH EXCEPTION:")
        logger.exception(e)
        logger.critical("=" * 70)
        # Don't raise - let the app start but with failures logged
        pass

    # ========== YIELD CONTROL TO APP ==========
    logger.info("\n>>> Application is now accepting requests <<<\n")
    yield
    # ========== SHUTDOWN ==========
    logger.info("\n" + "=" * 70)
    logger.info("STARTING APPLICATION SHUTDOWN SEQUENCE")
    logger.info("=" * 70)
    try:
        budget_model = None
        latest_state_inputs = []
        logger.info("✓ Resources cleaned up")
    except Exception as e:
        logger.exception(f"Error during shutdown: {e}")
    logger.info("[OK] Shutdown complete")
    logger.info("=" * 70)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Enhanced National Health Fund Allocation API",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# ENDPOINTS
# ============================================================================



@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/state-health-inputs", response_model=StateHealthInputsResponse)
def get_state_health_inputs() -> StateHealthInputsResponse:
    return StateHealthInputsResponse(
        source="enhanced_healthcare_dataset.csv",
        states=latest_state_inputs,
    )

@app.post("/allocate-funds", response_model=AllocateFundsResponse)
def allocate_funds(payload: AllocateFundsRequest) -> AllocateFundsResponse:
    if budget_model is None:
        raise HTTPException(status_code=500, detail="Budget model is not loaded.")

    X = pd.DataFrame(
        {
            "Population": [s.population for s in payload.states],
            "Health_Burden_Score": [s.health_burden_score for s in payload.states],
            "Need_Index": [s.need_index for s in payload.states],
            "Disease_Prevalence_Index": [s.disease_prevalence_index for s in payload.states],
            "Poverty_Rate": [s.poverty_rate for s in payload.states],
            "Doctors_per_1000": [s.doctors_per_1000 for s in payload.states],
        }
    )

    predicted_needs = budget_model.predict(X)
    safe_predicted_needs = [max(float(v), 1.0) for v in predicted_needs]
    total_need = sum(safe_predicted_needs)

    if total_need <= 0:
        raise HTTPException(status_code=400, detail="Predicted national need must be positive.")

    ranked_states: list[tuple[StateInput, float, float]] = []
    for idx, state in enumerate(payload.states):
        predicted_need = safe_predicted_needs[idx]
        crisis_score = (
            float(state.health_burden_score)
            * float(state.need_index)
            * float(state.poverty_rate)
        )
        ranked_states.append((state, predicted_need, crisis_score))

    ranked_states.sort(key=lambda t: t[2], reverse=True)

    allocations: list[AllocationRow] = []
    total_budget_remaining = float(payload.total_national_budget)
    deficit_reached = False

    for state, predicted_need, _crisis_score in ranked_states:
        if deficit_reached:
            allocations.append(
                AllocationRow(
                    state=state.state,
                    population=state.population,
                    health_burden_score=state.health_burden_score,
                    predicted_optimal_required_budget_cr=round(predicted_need, 2),
                    allocated_budget_cr=0.0,
                    allocation_share_percentage=0.0,
                    status="Deficit",
                )
            )
            continue

        if total_budget_remaining >= predicted_need:
            allocated_budget = predicted_need
            status = "Fully Funded"
            total_budget_remaining -= allocated_budget
        else:
            allocated_budget = max(total_budget_remaining, 0.0)
            status = "Deficit"
            total_budget_remaining = 0.0
            deficit_reached = True

        allocation_share_percentage = (
            (allocated_budget / payload.total_national_budget) * 100.0
            if payload.total_national_budget > 0
            else 0.0
        )

        allocations.append(
            AllocationRow(
                state=state.state,
                population=state.population,
                health_burden_score=state.health_burden_score,
                predicted_optimal_required_budget_cr=round(predicted_need, 2),
                allocated_budget_cr=round(allocated_budget, 2),
                allocation_share_percentage=round(allocation_share_percentage, 2),
                status=status,
            )
        )

    national_reserve_fund = round(max(total_budget_remaining, 0.0), 2)

    return AllocateFundsResponse(
        total_national_budget=round(payload.total_national_budget, 2),
        total_predicted_national_need_cr=round(total_need, 2),
        national_reserve_fund=round(national_reserve_fund, 2),
        allocations=allocations,
    )

@app.post("/explain-allocation", response_model=ExplainAllocationResponse)
def explain_allocation(payload: ExplainAllocationRequest) -> ExplainAllocationResponse:
    """
    Explain the budget allocation for a specific state.
    Attempts to use AI model if available, falls back to rule-based analysis.
    """
    logger.info(f"Explain allocation request for state: {payload.state}")
    
    # If AI model is loaded, use it
    if custom_ai_pipeline is not None:
        logger.info("Using AI pipeline for explanation")
        try:
            messages = [
                {"role": "system", "content": "You are Jan Swasthya Sahayak, an expert AI financial analyst for the Indian Ministry of Health."},
                {
                    "role": "user", 
                    "content": f"Explain the healthcare budget utilization for {payload.state}. Context: Allocated ₹{payload.ml_allocated_budget_cr:.2f} Cr, Need Index {payload.need_index:.2f}, Poverty Rate {payload.poverty_rate:.1f}%."
                }
            ]
            result = custom_ai_pipeline(messages, max_new_tokens=250)
            explanation = result[0]['generated_text'][-1]['content']
            logger.info("AI explanation generated successfully")
        except Exception as exc:
            logger.exception(f"AI pipeline failed, falling back to rule-based analysis: {exc}")
            explanation = _generate_fallback_explanation(payload)
    else:
        # Fallback: Generate explanation based on the data itself
        logger.info("Using fallback rule-based analysis")
        try:
            explanation = _generate_fallback_explanation(payload)
        except Exception as exc:
            logger.exception(f"Failed to generate explanation: {exc}")
            raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(exc)}")

    return ExplainAllocationResponse(
        state=payload.state,
        explanation=explanation.strip(),
        model="Custom-Jan-Swasthya-Analyzer (Analysis Mode)" if custom_ai_pipeline is None else "Custom-Jan-Swasthya-0.5B",
    )
