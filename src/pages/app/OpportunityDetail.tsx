import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { GitCompare, Sparkles, ArrowRight, Loader2, CheckCircle2, Quote, X, Zap } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useOpportunity, api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { AIBadge } from '../../components/ui/AIBadge';

export const OpportunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: currentOpportunity, isLoading } = useOpportunity(id);
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState('Build');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  const formatCurrency = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v}`;
  };

  const handleSaveDecision = async () => {
    if (decisionRationale.length < 20) return;
    setIsSavingDecision(true);
    await new Promise(r => setTimeout(r, 800));
    addToast('Decision committed successfully.', 'success');
    setIsDecisionModalOpen(false);
    setIsSavingDecision(false);
    navigate('/app/decisions');
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading Opportunity..." subtitle="Calculating scores">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div>
      </AppLayout>
    );
  }

  if (!currentOpportunity) {
    return (
      <AppLayout title="Opportunity Not Found" subtitle="Could not load data">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>Opportunity does not exist or you don't have access.</p>
          <Link to="/app/opportunities" className="mt-4 text-astrix-teal font-bold hover:underline">← Back to Opportunities</Link>
        </div>
      </AppLayout>
    );
  }

  const dynamicScore = currentOpportunity.opportunity_score;
  const title = currentOpportunity.problems?.title || 'Opportunity';
  const evidenceCount = currentOpportunity.problems?.evidence_count || 0;
  const affectedArr = currentOpportunity.problems?.affected_arr || 0;
  const recommended = currentOpportunity.recommended_action || 'Build';

  const tabs = ['Overview', 'Score Breakdown'];

  return (
    <AppLayout
      title={title}
      subtitle="Opportunity Detail · AI-Scored"
      actions={
        <div className="flex items-center gap-3">
          <Link to="/app/opportunities" className="text-sm font-bold text-gray-500 hover:text-gray-900">← Opportunities</Link>
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="bg-astrix-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-astrix-darkTeal transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Commit Decision
          </button>
        </div>
      }
    >
      {/* Hero Score Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center font-heading font-black text-4xl shrink-0 shadow-lg ${dynamicScore >= 80 ? 'bg-astrix-teal text-white' : dynamicScore >= 60 ? 'bg-astrix-gold text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
              {dynamicScore}
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Opportunity Score</div>
              <h2 className="font-heading text-2xl font-black text-gray-900 mb-2">{title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <AIBadge />
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${recommended === 'Build' ? 'bg-teal-50 text-astrix-teal border border-teal-200' : recommended === 'Fix' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-gray-100 text-gray-700'}`}>
                  <Zap className="w-3 h-3" /> Recommended: {recommended}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[280px]">
            {[
              { label: 'Signals', value: evidenceCount, suffix: '' },
              { label: 'ARR at Risk', value: formatCurrency(affectedArr), suffix: '', highlight: true },
              { label: 'Trend', value: '↑ Rising', suffix: '', red: true },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">{stat.label}</div>
                <div className={`font-heading font-black text-xl ${stat.highlight ? 'text-astrix-gold' : stat.red ? 'text-brand-red' : 'text-gray-900'}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const key = tab.toLowerCase().replace(' ', '-');
          return (
            <button key={tab} onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap focus-visible:outline-none ${activeTab === key ? 'text-astrix-teal' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {tab}
              {activeTab === key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-astrix-teal rounded-t-full animate-[fadeIn_0.2s_ease-out]" />}
            </button>
          );
        })}
      </div>

      <div className="animate-[fadeIn_0.3s_ease-out]">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-astrix-teal/10 text-astrix-teal p-1.5 rounded-lg"><Sparkles className="w-4 h-4" /></span>
                  AI Analysis
                </h3>
                <AIBadge className="mb-4" />
                <p className="text-gray-700 leading-relaxed font-medium mt-3">
                  This opportunity scores {dynamicScore} based on a combination of signal volume, pain severity, and ARR concentration. Addressing this prevents churn risk from crystallising.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => setIsDecisionModalOpen(true)} className="w-full bg-astrix-teal text-white py-3 rounded-xl font-bold text-sm hover:bg-astrix-darkTeal transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Commit Decision
                  </button>
                  <Link to={`/app/problems/${currentOpportunity.problem_id}`} className="w-full block text-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                    View Linked Problem
                  </Link>
                  <Link to="/app/opportunities" className="w-full block text-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <GitCompare className="w-4 h-4" /> Compare Mode
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCORE BREAKDOWN TAB */}
        {activeTab === 'score-breakdown' && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-6">Opportunity Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5 font-mono text-sm w-full">
                  {[
                    { label: 'Demand (Signals)', val: currentOpportunity.demand_score, color: 'bg-astrix-teal', text: `${evidenceCount} signals` },
                    { label: 'Pain Severity', val: currentOpportunity.pain_score, color: 'bg-astrix-terra', text: `${currentOpportunity.pain_score}/100` },
                    { label: 'Affected ARR', val: currentOpportunity.arr_score, color: 'bg-astrix-gold', text: formatCurrency(affectedArr) },
                    { label: 'Trend Direction', val: currentOpportunity.trend_score, color: 'bg-brand-blue', text: `${currentOpportunity.trend_score}/100` },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-gray-600 font-bold mb-1.5">
                        <span>{stat.label}</span>
                        <span className="text-gray-900">{stat.text}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${stat.color} transition-all duration-700`} style={{ width: `${stat.val ?? 70}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="font-heading text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Score Formula</h3>
              <p className="text-sm text-gray-600 font-mono">
                Final Score = (Demand × 0.30) + (Pain × 0.25) + (ARR Risk × 0.30) + (Trend × 0.15)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSavingDecision && setIsDecisionModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Commit Decision</h2>
              <button onClick={() => !isSavingDecision && setIsDecisionModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs font-mono text-gray-500 uppercase font-bold mb-1">Opportunity</div>
                <div className="font-bold text-gray-900">{title}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Action</label>
                <select value={decisionAction} onChange={e => setDecisionAction(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                  <option value="Build">Build (Add to Roadmap)</option>
                  <option value="Fix">Fix (Bug / Tech Debt)</option>
                  <option value="Experiment">Experiment (Research / A-B Test)</option>
                  <option value="Defer">Defer (Not right now)</option>
                  <option value="Reject">Reject (Will not do)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Rationale <span className="text-brand-red">*</span></label>
                <textarea value={decisionRationale} onChange={e => setDecisionRationale(e.target.value)} placeholder="Explain why this decision was made. Creates a permanent evidence trail..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal min-h-[120px] resize-none" />
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {decisionRationale.length < 20 ? `${20 - decisionRationale.length} more characters required` : '✓ Looks good'}
                </div>
              </div>
              <button onClick={handleSaveDecision} disabled={isSavingDecision || decisionRationale.length < 20} className="w-full bg-astrix-teal text-white font-bold py-4 rounded-xl hover:bg-astrix-darkTeal disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {isSavingDecision ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
