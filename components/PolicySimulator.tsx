import React, { useState, useEffect } from 'react';
import { RefreshCw, Gauge, Loader2 } from "lucide-react";

// List of all 36 Indian States and Union Territories
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// State data with all required fields for the API
interface StateData {
  state: string;
  population: number;
  disease_prevalence_index: number;
  poverty: number;
  doctorsPer1000: number;
}

const STATE_DATA: Record<string, StateData> = {
  'Andhra Pradesh': { state: 'Andhra Pradesh', population: 539, disease_prevalence_index: 0.72, poverty: 15.2, doctorsPer1000: 0.8 },
  'Arunachal Pradesh': { state: 'Arunachal Pradesh', population: 17, disease_prevalence_index: 0.65, poverty: 34.7, doctorsPer1000: 0.3 },
  'Assam': { state: 'Assam', population: 356, disease_prevalence_index: 0.78, poverty: 31.9, doctorsPer1000: 0.4 },
  'Bihar': { state: 'Bihar', population: 1287, disease_prevalence_index: 0.85, poverty: 33.7, doctorsPer1000: 0.3 },
  'Chhattisgarh': { state: 'Chhattisgarh', population: 294, disease_prevalence_index: 0.80, poverty: 39.9, doctorsPer1000: 0.4 },
  'Goa': { state: 'Goa', population: 16, disease_prevalence_index: 0.45, poverty: 5.1, doctorsPer1000: 1.5 },
  'Gujarat': { state: 'Gujarat', population: 638, disease_prevalence_index: 0.65, poverty: 16.6, doctorsPer1000: 0.9 },
  'Haryana': { state: 'Haryana', population: 289, disease_prevalence_index: 0.58, poverty: 11.2, doctorsPer1000: 0.7 },
  'Himachal Pradesh': { state: 'Himachal Pradesh', population: 75, disease_prevalence_index: 0.62, poverty: 8.1, doctorsPer1000: 0.6 },
  'Jharkhand': { state: 'Jharkhand', population: 401, disease_prevalence_index: 0.83, poverty: 36.9, doctorsPer1000: 0.3 },
  'Karnataka': { state: 'Karnataka', population: 675, disease_prevalence_index: 0.70, poverty: 20.9, doctorsPer1000: 0.8 },
  'Kerala': { state: 'Kerala', population: 346, disease_prevalence_index: 0.55, poverty: 7.1, doctorsPer1000: 1.2 },
  'Madhya Pradesh': { state: 'Madhya Pradesh', population: 853, disease_prevalence_index: 0.79, poverty: 31.6, doctorsPer1000: 0.4 },
  'Maharashtra': { state: 'Maharashtra', population: 1247, disease_prevalence_index: 0.68, poverty: 17.4, doctorsPer1000: 0.8 },
  'Manipur': { state: 'Manipur', population: 32, disease_prevalence_index: 0.81, poverty: 36.9, doctorsPer1000: 0.5 },
  'Meghalaya': { state: 'Meghalaya', population: 33, disease_prevalence_index: 0.77, poverty: 32.1, doctorsPer1000: 0.4 },
  'Mizoram': { state: 'Mizoram', population: 12, disease_prevalence_index: 0.74, poverty: 20.4, doctorsPer1000: 0.5 },
  'Nagaland': { state: 'Nagaland', population: 23, disease_prevalence_index: 0.79, poverty: 29.1, doctorsPer1000: 0.4 },
  'Odisha': { state: 'Odisha', population: 470, disease_prevalence_index: 0.81, poverty: 32.6, doctorsPer1000: 0.5 },
  'Punjab': { state: 'Punjab', population: 301, disease_prevalence_index: 0.60, poverty: 8.3, doctorsPer1000: 0.9 },
  'Rajasthan': { state: 'Rajasthan', population: 814, disease_prevalence_index: 0.73, poverty: 14.7, doctorsPer1000: 0.5 },
  'Sikkim': { state: 'Sikkim', population: 7, disease_prevalence_index: 0.64, poverty: 8.2, doctorsPer1000: 0.7 },
  'Tamil Nadu': { state: 'Tamil Nadu', population: 778, disease_prevalence_index: 0.66, poverty: 11.3, doctorsPer1000: 1.0 },
  'Telangana': { state: 'Telangana', population: 393, disease_prevalence_index: 0.72, poverty: 15.4, doctorsPer1000: 0.7 },
  'Tripura': { state: 'Tripura', population: 42, disease_prevalence_index: 0.76, poverty: 14.1, doctorsPer1000: 0.4 },
  'Uttar Pradesh': { state: 'Uttar Pradesh', population: 2378, disease_prevalence_index: 0.84, poverty: 29.4, doctorsPer1000: 0.4 },
  'Uttarakhand': { state: 'Uttarakhand', population: 117, disease_prevalence_index: 0.69, poverty: 11.3, doctorsPer1000: 0.6 },
  'West Bengal': { state: 'West Bengal', population: 1008, disease_prevalence_index: 0.74, poverty: 20.0, doctorsPer1000: 0.6 },
  'Andaman and Nicobar Islands': { state: 'Andaman and Nicobar Islands', population: 4, disease_prevalence_index: 0.50, poverty: 1.0, doctorsPer1000: 1.1 },
  'Chandigarh': { state: 'Chandigarh', population: 12, disease_prevalence_index: 0.45, poverty: 2.1, doctorsPer1000: 1.5 },
  'Dadra and Nagar Haveli and Daman and Diu': { state: 'Dadra and Nagar Haveli and Daman and Diu', population: 6, disease_prevalence_index: 0.67, poverty: 17.9, doctorsPer1000: 0.6 },
  'Delhi': { state: 'Delhi', population: 198, disease_prevalence_index: 0.58, poverty: 9.9, doctorsPer1000: 1.3 },
  'Jammu and Kashmir': { state: 'Jammu and Kashmir', population: 136, disease_prevalence_index: 0.71, poverty: 10.3, doctorsPer1000: 0.5 },
  'Ladakh': { state: 'Ladakh', population: 3, disease_prevalence_index: 0.63, poverty: 4.1, doctorsPer1000: 0.4 },
  'Lakshadweep': { state: 'Lakshadweep', population: 0.7, disease_prevalence_index: 0.48, poverty: 2.8, doctorsPer1000: 0.9 },
  'Puducherry': { state: 'Puducherry', population: 17, disease_prevalence_index: 0.59, poverty: 9.7, doctorsPer1000: 1.2 }
};

// API endpoint
const API_BASE = 'http://localhost:8000';

const PolicySimulator: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [povertySliderValue, setPovertySliderValue] = useState<number>(17.4);
  const [doctorsSliderValue, setDoctorsSliderValue] = useState<number>(0.8);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projectedBudget, setProjectedBudget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentState = STATE_DATA[selectedState];

  // Reset sliders when state changes
  useEffect(() => {
    if (currentState) {
      setPovertySliderValue(currentState.poverty);
      setDoctorsSliderValue(currentState.doctorsPer1000);
      setProjectedBudget(null);
      setError(null);
    }
  }, [selectedState]);

  // Fetch ML prediction from backend
  useEffect(() => {
    const fetchPrediction = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/simulate-policy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: currentState.state,
            population: currentState.population,
            disease_prevalence_index: currentState.disease_prevalence_index,
            target_poverty_rate: povertySliderValue,
            target_doctors_per_1000: doctorsSliderValue
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProjectedBudget(data.projected_required_budget_cr);
      } catch (err) {
        console.error('Policy simulation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to ML backend');
        setProjectedBudget(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce API calls
    const timer = setTimeout(() => {
      fetchPrediction();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedState, povertySliderValue, doctorsSliderValue, currentState]);

  // Format currency with Indian numbering (max 2 decimal places)
  const formatCurrency = (value: number): string => {
    if (value >= 100) {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    } else if (value >= 10) {
      return value.toLocaleString('en-IN', { maximumFractionDigits: 1 });
    }
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Policy Simulator</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">ML-driven budget projections</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
            <Gauge className="h-4 w-4 text-cyan-300" />
            Goal-Seek Model
          </div>
        </div>
      </div>

      {/* State Selection */}
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="max-w-md">
          <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Target State for Simulation</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state} className="bg-slate-900 text-slate-100">
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls and Results */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Sliders - Only Poverty and Doctors */}
        <div className="space-y-6 rounded-3xl border border-slate-700 bg-slate-800/95 p-6 shadow-lg shadow-slate-950/20">
          {/* Target Poverty Rate Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Target Poverty Rate (%)</p>
                <p className="text-xs text-slate-400">Current: <span className="font-semibold text-cyan-300">{povertySliderValue.toFixed(1)}%</span></p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-200">{povertySliderValue.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={0.1}
              value={povertySliderValue}
              onChange={(event) => setPovertySliderValue(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Target Doctors per 1000 Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Target Doctors per 1000</p>
                <p className="text-xs text-slate-400">Current: <span className="font-semibold text-cyan-300">{doctorsSliderValue.toFixed(2)}</span></p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-200">{doctorsSliderValue.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.01}
              value={doctorsSliderValue}
              onChange={(event) => setDoctorsSliderValue(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        {/* ML Projected Budget Result */}
        <div className="space-y-6">
          {/* Budget Card */}
          <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">ML Projected Budget</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">
                  {isLoading ? (
                    <span className="flex items-center gap-2 text-lg text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculating...
                    </span>
                  ) : projectedBudget !== null ? (
                    <>₹ {formatCurrency(projectedBudget)} Cr</>
                  ) : (
                    <>—</>
                  )}
                </h3>
                <p className="mt-1 text-xs text-slate-400">For {selectedState}</p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-3 text-cyan-300">
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
            </div>
            {error && (
              <p className="mt-2 text-xs text-amber-400">⚠️ {error}</p>
            )}
          </div>

          {/* Analysis Message */}
          <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-6 shadow-lg shadow-slate-950/20">
            <h4 className="text-lg font-semibold text-cyan-300 mb-4">Budget Projection</h4>
            {isLoading ? (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Querying ML model...</span>
              </div>
            ) : projectedBudget !== null ? (
              <p className="text-sm text-slate-300 leading-relaxed">
                To achieve these demographic targets, the ML model projects a required budget of <span className="font-semibold text-white">₹{formatCurrency(projectedBudget)} Cr</span>.
              </p>
            ) : (
              <p className="text-sm text-slate-400">Adjust the sliders to see the ML budget projection.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicySimulator;
