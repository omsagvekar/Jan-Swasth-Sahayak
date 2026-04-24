from __future__ import annotations

from pathlib import Path
from typing import Literal
import logging
from contextlib import asynccontextmanager

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ======================================================================
# 🩹 THE MONKEY PATCH (Fixes the PEFT Windows Bug)
# ======================================================================
import torch
if not hasattr(torch, 'float8_e8m0fnu'):
    setattr(torch, 'float8_e8m0fnu', torch.float32) # Trick PEFT into passing the check
# ======================================================================

# Import Hugging Face's AI pipeline and PEFT for LoRA Adapters
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Configure logging to capture all issues
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(asctime)s - %(name)s - %(message)s'
)
logger = logging.getLogger("main")

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "enhanced_healthcare_dataset.csv"
MODEL_PATH = BASE_DIR / "data" / "budget_model.pkl"

# Pointing FastAPI to your extracted custom AI folder (The LoRA Adapter)
SLM_MODEL_PATH = BASE_DIR / "my_local_slm"

# ============================================================================
# PYDANTIC MODELS
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

class ChatRequest(BaseModel):
    query: str
    context: str

# NEW: Simulator Models
class SimulatePolicyRequest(BaseModel):
    state: str
    population: int
    disease_prevalence_index: float
    target_poverty_rate: float
    target_doctors_per_1000: float

class SimulatePolicyResponse(BaseModel):
    state: str
    new_health_burden_score: float
    new_need_index: float
    projected_required_budget_cr: float


# ============================================================================
# GLOBAL VARIABLES
# ============================================================================

budget_model = None
latest_state_inputs: list[StateHealthInput] = []
custom_ai_pipeline = None  

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
    """Fallback Rule-based analysis if AI fails."""
    allocation = payload.ml_allocated_budget_cr
    need = payload.need_index
    burden = payload.health_burden_score
    poverty = payload.poverty_rate
    doctors = payload.doctors_per_1000
    
    lines = [f"Analysis for {payload.state}:\n\nBudget Allocation: Rs.{allocation:.2f} Crore\n"]
    
    if burden >= 75: lines.append("- High health burden: Significant disease prevalence and mortality rates.")
    elif burden >= 50: lines.append("- Moderate health burden: Notable health challenges in the region.")
    else: lines.append("- Lower health burden: Good health outcomes relative to national average.")
    
    if need >= 0.8: lines.append(f"- High need index ({need:.2f}): Critical healthcare infrastructure requirements.")
    else: lines.append(f"- Moderate need index ({need:.2f}): Reasonable healthcare infrastructure.")
    
    if poverty >= 30: lines.append(f"- High poverty rate ({poverty:.1f}%): Significant economic vulnerability affecting healthcare access.")
    else: lines.append(f"- Poverty rate ({poverty:.1f}%): Moderate economic capacity for healthcare access.")
    
    if doctors < 1: lines.append(f"- Low doctor availability ({doctors:.2f} per 1000): Critical shortage of medical professionals.")
    elif doctors < 2: lines.append(f"- Moderate doctor availability ({doctors:.2f} per 1000): Need for physician recruitment.")
    else: lines.append(f"- Reasonable doctor availability ({doctors:.2f} per 1000): Adequate medical workforce.")
    
    lines.append(f"\nRecommendation: This allocation of Rs.{allocation:.2f} Crore aims to address identified health burden while considering infrastructure gaps and socioeconomic factors. Funds were distributed using the Crisis-Weighted Proportional Allocation Algorithm.")
    
    return "\n".join(lines)

# ============================================================================
# LIFESPAN CONTEXT MANAGER
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global budget_model, latest_state_inputs, custom_ai_pipeline
    
    logger.info("=" * 70)
    logger.info("STARTING APPLICATION STARTUP SEQUENCE")
    logger.info("=" * 70)
    
    try:
        logger.info(f"Checking for model file at: {MODEL_PATH}")
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model file not found at {MODEL_PATH}. Run `python train_budget_model.py` first.")
        
        logger.info(f"Loading budget model...")
        budget_model = joblib.load(MODEL_PATH)
        
        logger.info(f"Loading state health inputs from: {DATA_PATH}")
        latest_state_inputs = _load_latest_state_inputs()
        
        if SLM_MODEL_PATH.exists():
            logger.info("🚀 Loading Base Model and attaching Custom LoRA Adapter... This may take a minute.")
            try:
                base_model_id = "Qwen/Qwen2.5-0.5B-Instruct"
                tokenizer = AutoTokenizer.from_pretrained(str(SLM_MODEL_PATH))
                
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_id, 
                    device_map="cpu",  
                    torch_dtype=torch.float32 
                )
                
                logger.info("🧠 Injecting custom financial knowledge...")
                model_with_adapter = PeftModel.from_pretrained(base_model, str(SLM_MODEL_PATH))
                
                custom_ai_pipeline = pipeline(
                    "text-generation", 
                    model=model_with_adapter, 
                    tokenizer=tokenizer,
                    device_map="cpu"   
                )
                logger.info("✅ Custom AI successfully loaded into memory!")
            except Exception as e:
                logger.error(f"❌ Failed to load AI model: {e}")
                custom_ai_pipeline = None 
        else:
            logger.warning(f"⚠️ WARNING: Custom AI folder not found at {SLM_MODEL_PATH}. App will use fallback rule-based analysis.")

        logger.info("[OK] Models and health inputs loaded successfully.")
        
    except Exception as e:
        logger.critical(f"STARTUP FAILED WITH EXCEPTION: {e}")
        pass

    logger.info("\n>>> Application is now accepting requests <<<\n")
    yield
    
    logger.info("STARTING APPLICATION SHUTDOWN SEQUENCE")
    try:
        budget_model = None
        latest_state_inputs = []
        custom_ai_pipeline = None 
        logger.info("✓ Resources cleaned up")
    except Exception as e:
        logger.exception(f"Error during shutdown: {e}")

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

    # 1. Run the ML Model
    X = pd.DataFrame({
        "Population": [s.population for s in payload.states],
        "Health_Burden_Score": [s.health_burden_score for s in payload.states],
        "Need_Index": [s.need_index for s in payload.states],
        "Disease_Prevalence_Index": [s.disease_prevalence_index for s in payload.states],
        "Poverty_Rate": [s.poverty_rate for s in payload.states],
        "Doctors_per_1000": [s.doctors_per_1000 for s in payload.states],
    })

    predicted_needs = budget_model.predict(X)
    safe_predicted_needs = [max(float(v), 1.0) for v in predicted_needs]
    total_predicted_need = sum(safe_predicted_needs)

    if total_predicted_need <= 0:
        raise HTTPException(status_code=400, detail="Predicted national need must be positive.")

    total_national_budget = float(payload.total_national_budget)
    allocations: list[AllocationRow] = []
    
    # 2. Calculate Crisis Weights for all states
    states_data = []
    total_national_weight = 0.0

    for idx, state in enumerate(payload.states):
        predicted_need = safe_predicted_needs[idx]
        crisis_multiplier = max((float(state.health_burden_score) * float(state.need_index) * float(state.poverty_rate)) / 1000.0, 0.1) 
        state_weight = predicted_need * crisis_multiplier
        total_national_weight += state_weight
        
        states_data.append({
            "state": state,
            "predicted_need": predicted_need,
            "crisis_multiplier": crisis_multiplier,
            "weight": state_weight,
            "allocated_budget": 0.0 # Will be populated by Waterfall
        })

    # 3. WATERFALL DISTRIBUTION ALGORITHM
    budget_remaining = total_national_budget
    
    if total_national_budget >= total_predicted_need:
        for data in states_data:
            data["allocated_budget"] = data["predicted_need"]
            budget_remaining -= data["predicted_need"]
    else:
        unmet_states = states_data.copy()
        
        while budget_remaining > 0.01 and len(unmet_states) > 0:
            total_weight = sum(s["weight"] for s in unmet_states)
            if total_weight <= 0:
                break
                
            pool_to_distribute = budget_remaining
            budget_remaining = 0.0 
            
            for data in unmet_states[:]: 
                share_of_pie = data["weight"] / total_weight
                proposed_grant = pool_to_distribute * share_of_pie
                
                if data["allocated_budget"] + proposed_grant >= data["predicted_need"]:
                    amount_needed = data["predicted_need"] - data["allocated_budget"]
                    data["allocated_budget"] = data["predicted_need"]
                    budget_remaining += (proposed_grant - amount_needed)
                    unmet_states.remove(data)
                else:
                    data["allocated_budget"] += proposed_grant

    # 4. Format the Output
    states_data.sort(key=lambda x: x["weight"], reverse=True)

    for data in states_data:
        state = data["state"]
        predicted_need = data["predicted_need"]
        allocated_budget = data["allocated_budget"]
        
        status = "Partial Funding (Deficit)" if allocated_budget < (predicted_need * 0.95) else "Fully Funded"
        allocation_share_percentage = (allocated_budget / total_national_budget) * 100.0 if total_national_budget > 0 else 0.0

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

    national_reserve_fund = round(max(budget_remaining, 0.0), 2)

    return AllocateFundsResponse(
        total_national_budget=round(total_national_budget, 2),
        total_predicted_national_need_cr=round(total_predicted_need, 2),
        national_reserve_fund=national_reserve_fund,
        allocations=allocations,
    )

@app.post("/explain-allocation", response_model=ExplainAllocationResponse)
def explain_allocation(payload: ExplainAllocationRequest) -> ExplainAllocationResponse:
    if custom_ai_pipeline is not None:
        try:
            messages = [
                {
                    "role": "system", 
                    "content": "You are a conversational, human-like AI assistant for the Indian Ministry of Health. Answer the user's specific question naturally and concisely based on the data. Do NOT output a generic rule-based report."
                },
                {
                    "role": "user", 
                    "content": f"Context Data: State={payload.state}, Allocated=₹{payload.ml_allocated_budget_cr:.2f} Cr, Need Index={payload.need_index:.2f}, Poverty Rate={payload.poverty_rate:.1f}%.\n\nUser Question: {payload.question}"
                }
            ]
            
            result = custom_ai_pipeline(
                messages, 
                max_new_tokens=200,
                truncation=True,     
                do_sample=True,      
                temperature=0.8,     
                top_p=0.9,           
                repetition_penalty=1.15 
            )
            
            explanation = result[0]['generated_text'][-1]['content']
            
        except Exception as exc:
            logger.error(f"❌ AI pipeline CRASHED during generation: {exc}")
            explanation = _generate_fallback_explanation(payload)
    else:
        try:
            explanation = _generate_fallback_explanation(payload)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(exc)}")

    return ExplainAllocationResponse(
        state=payload.state,
        explanation=explanation.strip(),
        model="Custom-Jan-Swasthya-Analyzer (Rule-Based)" if custom_ai_pipeline is None else "Custom-Jan-Swasthya-0.5B (Proprietary)",
    )


# ============================================================================
# NEW SIMULATE POLICY ENDPOINT (REPLACES FAKE UI MATH)
# ============================================================================

@app.post("/simulate-policy", response_model=SimulatePolicyResponse)
def simulate_policy_v2(payload: SimulatePolicyRequest) -> SimulatePolicyResponse:
    """
    Goal-Seek ML endpoint for Policy Simulator.
    Predicts the cost of changing demographics using the ML Model.
    """
    if budget_model is None:
        raise HTTPException(status_code=500, detail="ML Model offline.")

    # 1. Recalculate basic burden 
    new_burden = min(100.0, max(10.0, (payload.target_poverty_rate * 1.5) - (payload.target_doctors_per_1000 * 10)))
    new_need = min(1.0, max(0.1, new_burden / 100.0))

    # 2. Ask the ML Model how much this Utopian state costs!
    X_sim = pd.DataFrame({
        "Population": [payload.population],
        "Health_Burden_Score": [new_burden],
        "Need_Index": [new_need],
        "Disease_Prevalence_Index": [payload.disease_prevalence_index],
        "Poverty_Rate": [payload.target_poverty_rate],
        "Doctors_per_1000": [payload.target_doctors_per_1000],
    })

    projected_budget = float(budget_model.predict(X_sim)[0])

    return SimulatePolicyResponse(
        state=payload.state,
        new_health_burden_score=round(new_burden, 1),
        new_need_index=round(new_need, 2),
        projected_required_budget_cr=round(projected_budget, 2)
    )

@app.post("/api/policy-simulate", response_model=SimulatePolicyResponse)

def simulate_policy(payload: SimulatePolicyRequest) -> SimulatePolicyResponse:
    """Predict the cost of changing demographics using the ML Model."""
    if budget_model is None:
        raise HTTPException(status_code=500, detail="ML Model offline.")

    # 1. Recalculate basic burden 
    new_burden = min(100.0, max(10.0, (payload.target_poverty_rate * 1.5) - (payload.target_doctors_per_1000 * 10)))
    new_need = min(1.0, max(0.1, new_burden / 100.0))

    # 2. Ask the ML Model how much this Utopian state costs!
    X_sim = pd.DataFrame({
        "Population": [payload.population],
        "Health_Burden_Score": [new_burden],
        "Need_Index": [new_need],
        "Disease_Prevalence_Index": [payload.disease_prevalence_index],
        "Poverty_Rate": [payload.target_poverty_rate],
        "Doctors_per_1000": [payload.target_doctors_per_1000],
    })

    projected_budget = float(budget_model.predict(X_sim)[0])

    return SimulatePolicyResponse(
        state=payload.state,
        new_health_burden_score=round(new_burden, 1),
        new_need_index=round(new_need, 2),
        projected_required_budget_cr=round(projected_budget, 2)
    )

# ============================================================================
# NEW HARD-CAGED CHATBOT ENDPOINT 
# ============================================================================

@app.post("/api/chat")
def process_chat(request: ChatRequest) -> dict:
    """Chat Endpoint with Hard Keyword Interceptors to prevent hallucinations."""
    logger.info(f"Chat request received: {request.query}")
    user_query_lower = request.query.lower()

    # GUARDRAIL 1: Hard Keyword Interceptor (The Python Cage)
    forbidden_words = ['python', 'code', 'script', 'joke', 'poem', 'allocate', 'exact budget', 'crore', 'rupee', 'florida', 'tokyo']
    if any(word in user_query_lower for word in forbidden_words):
        return {"reply": "I am the National AI Health Financial Advisor. I am strictly programmed to analyze demographic health data for Indian states. I cannot write code, tell jokes, or discuss exact fiscal allocations directly in this chat."}

    # GUARDRAIL 2: Strict State Matcher
    matched_state = None
    context_data = ""
    for state_obj in latest_state_inputs:
        if state_obj.state.lower() in user_query_lower:
            matched_state = state_obj
            context_data = f"State: {state_obj.state} | Poverty: {state_obj.poverty_rate}% | Need Index: {state_obj.need_index:.2f} | Doctors per 1000: {state_obj.doctors_per_1000:.2f} | Health Burden: {state_obj.health_burden_score}"
            break 
            
    if not matched_state:
        return {"reply": "Please specify a valid Indian State or Union Territory for me to analyze."}

    # GUARDRAIL 3: Safely generate using ONLY the matched context
    system_prompt = f"You are a Health Financial Advisor. Read this data: {context_data}. Summarize the health situation in 2 sentences. Do not mention money."

    if custom_ai_pipeline is not None:
        try:
            messages = [
                {"role": "system", "content": system_prompt}, 
                {"role": "user", "content": request.query}
            ]
            result = custom_ai_pipeline(
                messages, 
                max_new_tokens=100, 
                truncation=True, 
                do_sample=True, 
                temperature=0.2
            )
            return {"reply": result[0]['generated_text'][-1]['content'].strip()}
        except Exception:
            return {"reply": "Sorry, I experienced a memory error."}
    return {"reply": "AI is offline due to memory constraints."}