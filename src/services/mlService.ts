export interface IcuPredictionRequest {
  state_name: string;
  active_cases: number;
  total_icu_beds: number;
  date: string;
}

export interface IcuPredictionResponse {
  status: string;
  state: string;
  date_analyzed: string;
  predicted_occupied_icu_beds: number;
  total_icu_beds: number;
  occupancy_rate_percentage: number;
}

export async function fetchIcuPrediction(
  request: IcuPredictionRequest
): Promise<IcuPredictionResponse> {
  const response = await fetch('http://localhost:8000/predict-icu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ICU prediction API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as IcuPredictionResponse;
  return data;
}

const API_BASE_URL = 'http://localhost:8000';

// UPDATED: Now includes all 6 features from Python
export interface StateHealthInput {
  state: string;
  population: number;
  health_burden_score: number;
  need_index: number;
  disease_prevalence_index: number;
  poverty_rate: number;
  doctors_per_1000: number;
  source_year: number;
}

export interface StateHealthInputsResponse {
  source: string;
  states: StateHealthInput[];
}

// UPDATED: Ensure request uses all 6 fields
export interface AllocateFundsRequest {
  total_national_budget: number;
  states: Array<{
    state: string;
    population: number;
    health_burden_score: number;
    need_index: number;
    disease_prevalence_index: number;
    poverty_rate: number;
    doctors_per_1000: number;
  }>;
}

// UPDATED: Includes status (Deficit or Fully Funded)
export interface AllocationRow {
  state: string;
  population: number;
  health_burden_score: number;
  predicted_optimal_required_budget_cr: number;
  allocated_budget_cr: number;
  allocation_share_percentage: number;
  status: string; 
}

// UPDATED: Includes the National Reserve Fund
export interface AllocateFundsResponse {
  total_national_budget: number;
  total_predicted_national_need_cr: number;
  national_reserve_fund: number;
  allocations: AllocationRow[];
}

// UPDATED: Includes the rich macroeconomic data for the LLM
export interface ExplainAllocationRequest {
  state: string;
  ml_allocated_budget_cr: number;
  health_burden_score: number;
  need_index: number;
  poverty_rate: number;
  doctors_per_1000: number;
  question: string;
}

export interface ExplainAllocationResponse {
  state: string;
  explanation: string;
  model: string;
}

export async function fetchStateHealthInputs(): Promise<StateHealthInputsResponse> {
  const response = await fetch(`${API_BASE_URL}/state-health-inputs`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`State inputs API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as StateHealthInputsResponse;
}

export async function allocateFunds(request: AllocateFundsRequest): Promise<AllocateFundsResponse> {
  const response = await fetch(`${API_BASE_URL}/allocate-funds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Allocate funds API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as AllocateFundsResponse;
}

export async function explainAllocation(
  request: ExplainAllocationRequest
): Promise<ExplainAllocationResponse> {
  const response = await fetch(`${API_BASE_URL}/explain-allocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Explain allocation API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as ExplainAllocationResponse;
}