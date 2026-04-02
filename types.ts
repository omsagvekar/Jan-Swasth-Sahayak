export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface StateData {
  id: string;
  name: string;
  hospitals: number;
  doctors: number;
  totalBeds: number;
  icuBeds: {
    total: number;
    occupied: number;
  };
  ventilators: {
    total: number;
    inUse: number;
  };
}

/** Rows aligned with `enhanced_healthcare_dataset.csv` (per state, per year). */
export interface StateBudgetData {
  year: number;
  state: string;
  allocatedBudgetCr: number;
  utilizedBudgetCr: number;
}
