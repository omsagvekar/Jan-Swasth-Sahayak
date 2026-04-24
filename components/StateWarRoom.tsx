import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChartBar, MessageSquare, Sparkles, ShieldAlert } from 'lucide-react';

const sampleKpi = {
  allocatedBudget: '₹ 482 Cr',
  needIndex: '91%',
  careCoverage: '78%',
  fundingGap: '₹ 96 Cr',
};

const mockChat = [
  {
    role: 'assistant',
    text: 'State funding is currently aligned with the latest healthcare need index. Ask me how to reduce the funding gap or optimize maternal care access.',
  },
];

const StateWarRoom: React.FC = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(mockChat);

  const stateLabel = useMemo(() => {
    if (!params.id) return 'Unknown State';
    return params.id
      .split('-')
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  }, [params.id]);

  const handleAsk = (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: 'user', text: question.trim() };
    const assistantMessage = {
      role: 'assistant',
      text: `For ${stateLabel}, boosting targeted preventive care and primary infrastructure investments can reduce the projected deficit by 14%.`,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setQuestion('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">State War Room</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{stateLabel}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Deep state-level intelligence for resource allocation, deficit tracking, and policy simulation. This view stays locked to the selected state, with priority funding insights and tactical AI support.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/compare')}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Explore Comparison
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {[
            { label: 'Allocated Budget', value: sampleKpi.allocatedBudget, icon: ChartBar },
            { label: 'Need Index', value: sampleKpi.needIndex, icon: ShieldAlert },
            { label: 'Care Coverage', value: sampleKpi.careCoverage, icon: Sparkles },
            { label: 'Funding Gap', value: sampleKpi.fundingGap, icon: ChartBar },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-3xl border border-slate-700 bg-slate-800/95 p-5 shadow-lg shadow-slate-950/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Performance Snapshot</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Budget health & coverage</h3>
            </div>
            <span className="rounded-3xl bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Locked to {stateLabel}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-5">
              <p className="text-sm text-slate-400">Predicted Lives Impacted</p>
              <p className="mt-4 text-3xl font-semibold text-white">1.2M+</p>
              <p className="mt-3 text-sm text-slate-500">Based on current allocation intensity and infrastructure score.</p>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-800/95 p-5">
              <p className="text-sm text-slate-400">Risk Mitigation Score</p>
              <p className="mt-4 text-3xl font-semibold text-white">82%</p>
              <p className="mt-3 text-sm text-slate-500">Confidence level for the next funding quarter.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-700 bg-slate-800/95 p-6 shadow-lg shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">State headline</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Core intervention focus</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            The current model prioritizes primary care upgrades, rural health hubs, and targeted maternal outreach. The next iteration can shift resources toward infrastructure if the need index moves above 94%.
          </p>

          <div className="mt-6 space-y-4">
            {['Preventive Health', 'Supply Chain Resilience', 'Telemedicine Access'].map((label) => (
              <div key={label} className="rounded-3xl bg-slate-900/90 px-4 py-4 border border-slate-700">
                <p className="text-sm font-medium text-slate-100">{label}</p>
                <p className="mt-2 text-sm text-slate-400">Projected uplift if funding is adjusted by 8%.</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Ask AI</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">State advisory assistant</h3>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300">
            Context locked to <span className="font-semibold text-slate-100">{stateLabel}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-3xl border px-4 py-4 ${
                message.role === 'assistant'
                  ? 'border-slate-700 bg-slate-800 text-slate-200'
                  : 'border-cyan-500/30 bg-slate-900 text-slate-100'
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                <span>{message.role === 'assistant' ? 'Advisor' : 'You'}</span>
              </div>
              <p className="text-sm leading-6">{message.text}</p>
            </div>
          ))}
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleAsk}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Ask about allocation, gap mitigation, or infrastructure tradeoffs..."
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Send question
          </button>
        </form>
      </section>
    </div>
  );
};

export default StateWarRoom;
