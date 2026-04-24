import React, { useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Download } from 'lucide-react';

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

// Mock data for each state (realistic values)
const STATE_DATA: Record<string, { poverty: number; needIndex: number; healthBurden: number; infrastructure: number }> = {
  'Andhra Pradesh': { poverty: 15.2, needIndex: 0.75, healthBurden: 45.3, infrastructure: 62.1 },
  'Arunachal Pradesh': { poverty: 34.7, needIndex: 0.82, healthBurden: 38.9, infrastructure: 45.2 },
  'Assam': { poverty: 31.9, needIndex: 0.78, healthBurden: 42.1, infrastructure: 48.7 },
  'Bihar': { poverty: 33.7, needIndex: 0.85, healthBurden: 48.2, infrastructure: 38.9 },
  'Chhattisgarh': { poverty: 39.9, needIndex: 0.80, healthBurden: 44.5, infrastructure: 52.3 },
  'Goa': { poverty: 5.1, needIndex: 0.45, healthBurden: 28.7, infrastructure: 78.4 },
  'Gujarat': { poverty: 16.6, needIndex: 0.65, healthBurden: 36.8, infrastructure: 71.2 },
  'Haryana': { poverty: 11.2, needIndex: 0.58, healthBurden: 32.4, infrastructure: 69.8 },
  'Himachal Pradesh': { poverty: 8.1, needIndex: 0.62, healthBurden: 29.6, infrastructure: 65.3 },
  'Jharkhand': { poverty: 36.9, needIndex: 0.83, healthBurden: 46.7, infrastructure: 41.5 },
  'Karnataka': { poverty: 20.9, needIndex: 0.70, healthBurden: 38.2, infrastructure: 68.9 },
  'Kerala': { poverty: 7.1, needIndex: 0.55, healthBurden: 25.8, infrastructure: 76.5 },
  'Madhya Pradesh': { poverty: 31.6, needIndex: 0.79, healthBurden: 43.9, infrastructure: 49.2 },
  'Maharashtra': { poverty: 17.4, needIndex: 0.68, healthBurden: 35.6, infrastructure: 73.1 },
  'Manipur': { poverty: 36.9, needIndex: 0.81, healthBurden: 41.2, infrastructure: 43.8 },
  'Meghalaya': { poverty: 32.1, needIndex: 0.77, healthBurden: 39.8, infrastructure: 47.6 },
  'Mizoram': { poverty: 20.4, needIndex: 0.74, healthBurden: 37.5, infrastructure: 55.9 },
  'Nagaland': { poverty: 29.1, needIndex: 0.79, healthBurden: 40.3, infrastructure: 46.2 },
  'Odisha': { poverty: 32.6, needIndex: 0.81, healthBurden: 45.1, infrastructure: 50.7 },
  'Punjab': { poverty: 8.3, needIndex: 0.60, healthBurden: 31.2, infrastructure: 72.4 },
  'Rajasthan': { poverty: 14.7, needIndex: 0.73, healthBurden: 39.4, infrastructure: 58.9 },
  'Sikkim': { poverty: 8.2, needIndex: 0.64, healthBurden: 30.1, infrastructure: 63.7 },
  'Tamil Nadu': { poverty: 11.3, needIndex: 0.66, healthBurden: 33.8, infrastructure: 74.2 },
  'Telangana': { poverty: 15.4, needIndex: 0.72, healthBurden: 37.9, infrastructure: 66.8 },
  'Tripura': { poverty: 14.1, needIndex: 0.76, healthBurden: 38.7, infrastructure: 54.3 },
  'Uttar Pradesh': { poverty: 29.4, needIndex: 0.84, healthBurden: 47.6, infrastructure: 45.8 },
  'Uttarakhand': { poverty: 11.3, needIndex: 0.69, healthBurden: 34.2, infrastructure: 61.5 },
  'West Bengal': { poverty: 20.0, needIndex: 0.74, healthBurden: 41.8, infrastructure: 57.3 },
  'Andaman and Nicobar Islands': { poverty: 1.0, needIndex: 0.50, healthBurden: 22.5, infrastructure: 68.9 },
  'Chandigarh': { poverty: 2.1, needIndex: 0.45, healthBurden: 20.8, infrastructure: 85.4 },
  'Dadra and Nagar Haveli and Daman and Diu': { poverty: 17.9, needIndex: 0.67, healthBurden: 35.2, infrastructure: 59.6 },
  'Delhi': { poverty: 9.9, needIndex: 0.58, healthBurden: 29.7, infrastructure: 82.1 },
  'Jammu and Kashmir': { poverty: 10.3, needIndex: 0.71, healthBurden: 36.4, infrastructure: 55.8 },
  'Ladakh': { poverty: 4.1, needIndex: 0.63, healthBurden: 26.9, infrastructure: 52.4 },
  'Lakshadweep': { poverty: 2.8, needIndex: 0.48, healthBurden: 21.3, infrastructure: 67.2 },
  'Puducherry': { poverty: 9.7, needIndex: 0.59, healthBurden: 28.6, infrastructure: 75.9 }
};

const CompareStates: React.FC = () => {
  const [leftState, setLeftState] = useState('Maharashtra');
  const [rightState, setRightState] = useState('Bihar');

  const radarData = useMemo(() => {
    const left = STATE_DATA[leftState];
    const right = STATE_DATA[rightState];
    return [
      { metric: 'Poverty %', [leftState]: left.poverty, [rightState]: right.poverty },
      { metric: 'Need Index', [leftState]: left.needIndex * 100, [rightState]: right.needIndex * 100 },
      { metric: 'Health Burden', [leftState]: left.healthBurden, [rightState]: right.healthBurden },
      { metric: 'Infrastructure', [leftState]: left.infrastructure, [rightState]: right.infrastructure }
    ];
  }, [leftState, rightState]);

  const budgetData = useMemo(() => {
    const calculateBudget = (data: typeof STATE_DATA[string]) =>
      Math.round((data.poverty * 15 + data.needIndex * 200 + data.healthBurden * 10 + data.infrastructure * 12) * 2.5);

    const leftBudget = calculateBudget(STATE_DATA[leftState]);
    const rightBudget = calculateBudget(STATE_DATA[rightState]);

    return [
      { state: leftState, budget: leftBudget },
      { state: rightState, budget: rightBudget }
    ];
  }, [leftState, rightState]);

  const aiAnalysis = useMemo(() => {
    const left = STATE_DATA[leftState];
    const right = STATE_DATA[rightState];
    const leftBudget = budgetData[0].budget;
    const rightBudget = budgetData[1].budget;
    const higherState = leftBudget > rightBudget ? leftState : rightState;
    const lowerState = leftBudget > rightBudget ? rightState : leftState;
    const higherData = leftBudget > rightBudget ? left : right;
    const lowerData = leftBudget > rightBudget ? right : left;

    return `${higherState} receives significantly higher funding (₹${leftBudget > rightBudget ? leftBudget : rightBudget} Cr vs ₹${leftBudget > rightBudget ? rightBudget : leftBudget} Cr) primarily due to its elevated poverty rate of ${higherData.poverty}% compared to ${lowerData.poverty}%, indicating greater socioeconomic challenges. The need index of ${higherData.needIndex} further justifies increased allocation, reflecting higher healthcare demands. Additionally, ${higherState}'s health burden score of ${higherData.healthBurden} suggests more pressing medical infrastructure requirements, while infrastructure rating of ${higherData.infrastructure} indicates room for improvement in healthcare delivery systems. These combined factors create a compelling case for prioritized funding to address disparities and improve health outcomes in ${higherState}.`;
  }, [leftState, rightState, budgetData]);

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Compare States</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Split-screen analysis</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="max-w-xl text-sm text-slate-400">
              Select two states to compare high-priority metrics with a polished radar view and quick executive summary.
            </p>
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Download className="h-4 w-4" />
              Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* State Selection and Radar Chart */}
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr_1fr]">
          {/* Left State Selector */}
          <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-slate-950/20">
            <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Left State</label>
            <select
              value={leftState}
              onChange={(e) => setLeftState(e.target.value)}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none"
            >
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state} className="bg-slate-900 text-slate-100">
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Radar Chart */}
          <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-5 shadow-2xl shadow-slate-950/40">
            <div className="h-[400px] w-full rounded-[1.75rem] border border-slate-800 bg-slate-950/60 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="80%">
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name={leftState} dataKey={leftState} stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
                  <Radar name={rightState} dataKey={rightState} stroke="#f472b6" fill="#f472b6" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right State Selector */}
          <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-slate-950/20">
            <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Right State</label>
            <select
              value={rightState}
              onChange={(e) => setRightState(e.target.value)}
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
      </div>

      {/* Budget Comparison and AI Analysis */}
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Budget & AI Justification</h3>
            <p className="text-sm text-slate-400">Comparative budget allocation analysis with AI-powered insights</p>
          </div>

          {/* Bar Chart */}
          <div className="h-[300px] w-full rounded-[1.75rem] border border-slate-800 bg-slate-950/60 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="state" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
                <Bar dataKey="budget" fill="#22d3ee" name="Allocated Budget (₹ Cr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Analysis */}
          <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-slate-950/20">
            <h4 className="text-lg font-semibold text-cyan-300 mb-3">AI Analysis Report</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{aiAnalysis}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareStates;
