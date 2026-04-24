import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const NationalAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello Minister. I am the National AI Health Financial Advisor. I can help you analyze healthcare funding strategies, predict budget impacts, and provide insights on policy decisions. How may I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('budget') && lowerMessage.includes('increase')) {
      return `Based on your query about budget increases, I recommend a strategic approach to healthcare funding allocation. The current national health mission requires approximately ₹85,000 crores for the next fiscal year, representing a 12.5% increase from the previous allocation. This escalation is primarily driven by:

1. **Demographic Pressures**: India's population growth and aging demographics are increasing healthcare demands by 8-10% annually. The elderly population (60+) is projected to reach 200 million by 2030, requiring specialized geriatric care infrastructure.

2. **Disease Burden Evolution**: Non-communicable diseases (NCDs) now account for 63% of total disease burden, up from 42% a decade ago. Cardiovascular diseases, diabetes, and cancers require sophisticated treatment protocols and preventive care programs.

3. **Infrastructure Gaps**: Current healthcare infrastructure covers only 1.2 beds per 1,000 population, compared to WHO's recommended 2.5 beds. Rural areas face acute shortages, with 68% of sub-centers lacking basic diagnostic equipment.

4. **Technology Integration**: Digital health initiatives, telemedicine, and AI-driven diagnostics require significant upfront investments but promise long-term efficiency gains of 25-30% in healthcare delivery costs.

I recommend prioritizing investments in:
- Primary healthcare strengthening (40% of additional budget)
- NCD prevention and management programs (25%)
- Medical education and workforce development (20%)
- Digital health infrastructure (15%)

This allocation strategy would ensure sustainable healthcare improvements while maintaining fiscal prudence. Would you like me to elaborate on any specific aspect of this funding strategy?`;
    }

    if (lowerMessage.includes('poverty') || lowerMessage.includes('bihar') || lowerMessage.includes('uttar pradesh')) {
      return `Regarding poverty-impacted states and healthcare funding, the data reveals critical insights for policy formulation. States with poverty rates above 30% (Bihar, Jharkhand, Odisha, Madhya Pradesh, Chhattisgarh) require differentiated funding approaches:

**Socioeconomic Context Analysis:**
- Poverty rates in these states range from 31.6% to 39.9%, significantly above the national average of 21.9%
- Health burden indices are correspondingly elevated, with Bihar showing a 48.2 health burden score
- Infrastructure development indices remain low, ranging from 38.9 to 52.3

**Recommended Funding Strategy:**
1. **Integrated Poverty-Health Programs**: Allocate 35% of state budgets for programs combining income support with healthcare access
2. **Mobile Health Units**: Deploy 500 additional mobile health vans across high-poverty districts
3. **Community Health Workers**: Increase ASHAs and other frontline workers by 40% in these states
4. **Preventive Care Focus**: 60% of funding should target malnutrition, sanitation, and maternal-child health

**Expected Outcomes:**
- 25% reduction in infant mortality rates within 3 years
- 30% improvement in healthcare access for rural populations
- 20% decrease in catastrophic health expenditures for poor households

**Implementation Challenges:**
- Logistical difficulties in reaching remote areas
- Capacity building requirements for local health systems
- Monitoring and evaluation framework development

This approach would address both immediate health needs and long-term poverty reduction through improved health outcomes. The estimated additional investment of ₹45,000 crores over 5 years would yield a benefit-cost ratio of 3.2:1.`;
    }

    if (lowerMessage.includes('ai') || lowerMessage.includes('technology') || lowerMessage.includes('digital')) {
      return `The integration of AI and digital technologies in India's healthcare system presents transformative opportunities. My analysis indicates that strategic investments in digital health infrastructure could yield efficiency gains of 28-35% while improving health outcomes significantly.

**Current Digital Health Landscape:**
- Telemedicine penetration: 12% of healthcare facilities
- Electronic Health Records (EHR): Implemented in 23% of hospitals
- AI diagnostic tools: Available in 8% of tertiary care centers
- Health information systems: 34% coverage at district level

**Recommended Digital Health Roadmap:**

1. **Phase 1 (2026-2028): Foundation Building**
   - National Health Information Network expansion to all districts
   - EHR implementation in 70% of hospitals
   - Telemedicine infrastructure in 50,000 health facilities
   - Investment: ₹25,000 crores

2. **Phase 2 (2028-2030): AI Integration**
   - AI-powered diagnostic assistants in 200 medical colleges
   - Predictive analytics for disease outbreaks
   - Personalized treatment recommendation systems
   - Investment: ₹35,000 crores

3. **Phase 3 (2030-2032): Advanced Analytics**
   - Population health management platforms
   - Real-time health surveillance systems
   - AI-driven resource allocation optimization
   - Investment: ₹40,000 crores

**Expected Benefits:**
- 30% reduction in diagnostic errors
- 25% improvement in treatment outcomes
- 40% increase in healthcare system efficiency
- 50% faster disease surveillance and response

**Implementation Strategy:**
- Public-private partnerships for technology development
- Capacity building programs for healthcare professionals
- Data privacy and security frameworks
- Pilot programs in 10 states before national rollout

The total investment of ₹100,000 crores over 7 years would generate a return on investment of 4.5:1 through improved health outcomes and system efficiencies.`;
    }

    // Default response
    return `Thank you for your query about "${userMessage}". As the National AI Health Financial Advisor, I can provide comprehensive analysis on healthcare funding, policy impacts, demographic trends, and strategic recommendations for India's health mission.

Based on current data and projections, here are key insights relevant to your question:

**Healthcare Funding Overview:**
- Total national health expenditure: ₹8.9 lakh crores (2025-26 estimated)
- Per capita health spending: ₹6,493 (below WHO recommended $86)
- Public health spending: 1.35% of GDP (target: 2.5% by 2030)
- Private health spending: 2.1% of GDP

**Key Challenges:**
1. **Resource Distribution**: 70% of healthcare resources concentrated in urban areas serving 30% of population
2. **Human Resources**: Shortage of 6 lakh doctors and 20 lakh nurses
3. **Infrastructure Gap**: 2.4 lakh additional hospital beds required
4. **Access Disparities**: Rural healthcare access 60% lower than urban

**Strategic Recommendations:**
- Increase public health spending to 2.5% of GDP by 2030
- Focus on primary healthcare strengthening (70% of investments)
- Digital health transformation with AI integration
- Public-private partnerships for infrastructure development
- Capacity building and skill development programs

Would you like me to elaborate on any specific aspect of healthcare policy, funding allocation, or implementation strategies? I can provide detailed analysis on state-wise performance, disease burden trends, or specific program recommendations.`;
  };

  const handleSendMessage = async () => {
    const query = inputValue.trim();
    if (!query || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, context: 'National Health Budget Analyst' }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply ?? 'System Error: Unable to connect to the National AI Health Node. Please ensure the backend server is running.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'ai',
        content: 'System Error: Unable to connect to the National AI Health Node. Please ensure the backend server is running.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/95 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20">
            <Bot className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">National AI Health Advisor</h1>
            <p className="text-sm text-slate-400">Ministry of Health Financial Intelligence</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-cyan-900/50 text-white'
                    : 'bg-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === 'ai' && (
                    <Bot className="mt-1 h-4 w-4 flex-shrink-0 text-cyan-400" />
                  )}
                  {message.role === 'user' && (
                    <User className="mt-1 h-4 w-4 flex-shrink-0 text-cyan-300" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className="mt-2 text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-slate-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Bot className="h-4 w-4 text-cyan-400" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-slate-400">AI Advisor is typing</span>
                    <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-slate-700 bg-slate-900/95 px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about healthcare funding, policy analysis, or strategic recommendations..."
              className="flex-1 rounded-3xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-500"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Press Enter to send • AI responses are generated for policy analysis and strategic guidance
          </p>
        </div>
      </div>
    </div>
  );
};

export default NationalAIChat;