import { type StateData, type StateBudgetData } from '../types';

let cachedStateData: StateData[] | null = null;
let cachedStateBudgetData: StateBudgetData[] | null = null;

function parseEnhancedHealthcareCsv(text: string): StateBudgetData[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim());
  const iYear = header.indexOf('Year');
  const iState = header.indexOf('State');
  const iAlloc = header.indexOf('Allocated_Budget_Cr');
  const iUtil = header.indexOf('Utilized_Budget_Cr');
  if (iYear < 0 || iState < 0 || iAlloc < 0 || iUtil < 0) return [];

  const rows: StateBudgetData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < Math.max(iYear, iState, iAlloc, iUtil) + 1) continue;

    const year = Number(parts[iYear]);
    const state = String(parts[iState]).trim();
    const allocatedBudgetCr = Number(parts[iAlloc]);
    const utilizedBudgetCr = Number(parts[iUtil]);
    if (!Number.isFinite(year) || !state || !Number.isFinite(allocatedBudgetCr) || !Number.isFinite(utilizedBudgetCr)) {
      continue;
    }
    rows.push({ year, state, allocatedBudgetCr, utilizedBudgetCr });
  }
  return rows;
}

export const fetchStateData = async (): Promise<StateData[]> => {
  if (cachedStateData !== null) return cachedStateData;
  try {
    const response = await fetch('/mockData.json');
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    cachedStateData = data.stateData ?? [];
  } catch {
    cachedStateData = [];
  }
  return cachedStateData;
};

export const fetchStateBudgetData = async (): Promise<StateBudgetData[]> => {
  if (cachedStateBudgetData !== null) return cachedStateBudgetData;
  try {
    const response = await fetch('/enhanced_healthcare_dataset.csv');
    if (!response.ok) throw new Error(String(response.status));
    const text = await response.text();
    cachedStateBudgetData = parseEnhancedHealthcareCsv(text);
  } catch {
    cachedStateBudgetData = [];
  }
  return cachedStateBudgetData;
};
