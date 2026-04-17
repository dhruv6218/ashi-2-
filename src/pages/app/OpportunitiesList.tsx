import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Filter, ArrowRight, Target, GitCompare, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useOpportunities, api } from '../../lib/api';
import { Opportunity } from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const OpportunitiesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { data: opportunities, isLoading, refetch } = useOpportunities(activeWorkspace?.id);
  const { addToast } = useToast();

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedOpps, setSelectedOpps] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionOpp, setDecisionOpp] = useState<Opportunity | null>(null);
  const [decisionAction, setDecisionAction] = useState('Build');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  
  const [showArtifactPrompt, setShowArtifactPrompt] = useState(false);
  const [savedDecisionId, setSavedDecisionId] = useState<string | null>(null);
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);

  const toggleOpp = (id: string) => {
    if (selectedOpps.includes(id)) {
      setSelectedOpps(selectedOpps.filter(o => o !== id));
    } else if (selectedOpps.length < 3) {
      setSelectedOpps([...selectedOpps, id]);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const openDecisionModal = (opp: Opportunity) => {
    setDecisionOpp(opp);
    setDecisionAction(opp.recommended_action === 'review' ? 'Build' : (opp.recommended_action || 'Build'));
    setDecisionRationale('');
    setIsDecisionModalOpen(true);
    setShowComparison(false);
  };

  const handleSaveDecision = async () => {
    if (!activeWorkspace || !user || !decisionOpp || decisionRationale.length < 20) return;
    
    setIsSavingDecision(true);
    try {
      const newDecision = await api.decisions.create({
        workspace_id: activeWorkspace.id,
        opportunity_id: decisionOpp.id,
        problem_id: decisionOpp.problem_id,
        title: decisionOpp.problems?.title || 'Decision',
        action: decisionAction,
        rationale: decisionRationale,
        author_id: user.id
      });

      addToast("Decision logged successfully.", "success");
      setSavedDecisionId(newDecision?.id || null);
      setIsDecisionModalOpen(false);
      setShowArtifactPrompt(true);
      refetch();
    } catch (error: any) {
      addToast(error.message || "Failed to save decision", "error");
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleGenerateArtifact = async (type: string) => {
    if (!activeWorkspace || !savedDecisionId || !user) return;
    
    setIsGeneratingArtifact(true);
    try {
      // Simulate AI generation
      await new Promise(r => setTimeout(r, 3000));
      await api.artifacts.create({
        workspace_id: activeWorkspace.id,
        decision_id: savedDecisionId,
        title: 'Generated PRD',
        type: type,
        content: '# Generated Content',
        author_id: user.id
      });

      addToast("Artifact generated successfully via AI!", "success");
      setShowArtifactPrompt(false);
      navigate(`/app/decisions/${savedDecisionId}`);
    } catch (error: any) {
      addToast(error.message || "Failed to generate artifact.", "error");
    } finally {
      setIsGeneratingArtifact(false);
    }
  };

  if (showComparison) {
    return (
      <AppLayout title="Compare Opportunities" subtitle="Decision Lab">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setShowComparison(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
            <X className="w-4 h-4" /> Close Compare
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar">
          {selectedOpps.map(id => {
            const opp = opportunities.find(o => o.id === id);
            if (!opp) return null;
            return (
              <div key={id} className="w-[320px] shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50 relative">
                  <div className={`absolute top-0 left-0 w-full h-1 ${opp.opportunity_score >= 80 ? 'bg-astrix-teal' : 'bg-astrix-gold'}`}></div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-heading text-lg font-bold text-gray-900 leading-tight pr-2">{opp.problems?.title}</h3>
                    <div className="text-xl font-black text-astrix-teal">{opp.opportunity_score}</div>
                  </div>
                </div>
                <div className="p-5 space-y-4 font-mono text-sm flex-1">
                  <div className="flex justify-between border-b border-gray-100 pb-2"><span>Demand</span> <strong>{opp.problems?.evidence_count} sigs</strong></div>
                  <div className="flex justify-between border-b border-gray-100 pb-2"><span>Pain</span> <strong>{opp.pain_score}/100</strong></div>
                  <div className="flex justify-between border-b border-gray-100 pb-2"><span>ARR</span> <strong className="text-astrix-gold">{formatCurrency(opp.problems?.affected_arr || 0)}</strong></div>
                  <div className="flex justify-between border-b border-gray-100 pb-2"><span>Trend</span> <strong>{opp.trend_score}/100</strong></div>
                  <div className="flex justify-between border-b border-gray-100 pb-2"><span>AI Rec</span> <strong className="text-astrix-teal capitalize">{opp.recommended_action}</strong></div>
                </div>
                <div className="p-5 border-t border-gray-100">
                  <button onClick={() => openDecisionModal(opp)} className="w-full py-3 bg-astrix-teal text-white rounded-xl font-bold hover:bg-teal-700 transition-colors">
                    Make Decision
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Opportunities" 
      subtitle="Ranked by Account ARR, Demand, and Pain Severity."
      actions={
        <div className="flex gap-3">
          {isCompareMode ? (
            <>
              <button onClick={() => { setIsCompareMode(false); setSelectedOpps([]); }} className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2">Cancel</button>
              <button 
                onClick={() => setShowComparison(true)}
                disabled={selectedOpps.length < 2}
                className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 shadow-sm"
              >
                Compare Selected ({selectedOpps.length})
              </button>
            </>
          ) : (
            <button onClick={() => setIsCompareMode(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
              <GitCompare className="w-4 h-4" /> Compare Mode
            </button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4"><Skeleton className="w-full h-24" /><Skeleton className="w-full h-24" /></div>
      ) : opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Target className="w-12 h-12 mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No opportunities scored yet</h3>
          <p className="font-medium text-sm mb-4">Run AI clustering on the Problems page to generate opportunities.</p>
          <Link to="/app/problems" className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Go to Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group ${selectedOpps.includes(opp.id) ? 'border-astrix-teal bg-teal-50/10' : 'border-gray-200 hover:shadow-md'}`}>
              
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                {isCompareMode && (
                  <input type="checkbox" checked={selectedOpps.includes(opp.id)} onChange={() => toggleOpp(opp.id)} className="w-5 h-5 accent-astrix-teal cursor-pointer" />
                )}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-heading font-black text-2xl shrink-0 ${opp.opportunity_score >= 80 ? 'bg-astrix-teal text-white shadow-md' : opp.opportunity_score >= 60 ? 'bg-astrix-gold text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                  {opp.opportunity_score}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">{opp.problems?.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono font-medium text-gray-500">
                    <span className="px-2 py-0.5 rounded uppercase tracking-wider font-bold bg-gray-100 text-gray-700 capitalize">{opp.recommended_action || 'Review'}</span>
                    <span>{opp.problems?.evidence_count || 0} Signals</span>
                    <span>•</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(opp.problems?.affected_arr || 0)} ARR</span>
                  </div>
                </div>
              </div>

              {!isCompareMode && (
                <div className="w-full md:w-auto flex justify-end shrink-0">
                  <button onClick={() => openDecisionModal(opp)} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:border-astrix-teal hover:text-astrix-teal transition-colors flex items-center gap-2">
                    Make Decision <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline Decision Modal */}
      {isDecisionModalOpen && decisionOpp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSavingDecision && setIsDecisionModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Commit Decision</h2>
              <button onClick={() => !isSavingDecision && setIsDecisionModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs font-mono text-gray-500 uppercase font-bold mb-1">Opportunity</div>
                <div className="font-bold text-gray-900">{decisionOpp.problems?.title}</div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Action</label>
                <select 
                  value={decisionAction}
                  onChange={(e) => setDecisionAction(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal"
                >
                  <option value="Build">Build (Add to Roadmap)</option>
                  <option value="Fix">Fix (Bug/Tech Debt)</option>
                  <option value="Experiment">Experiment (Research/A-B Test)</option>
                  <option value="Defer">Defer (Not right now)</option>
                  <option value="Reject">Reject (Will not do)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Rationale <span className="text-red-500">*</span></label>
                <textarea 
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  placeholder="Explain why this decision was made. This creates a permanent paper trail..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal min-h-[120px] resize-none"
                ></textarea>
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {decisionRationale.length < 20 ? `${20 - decisionRationale.length} more characters required` : 'Looks good'}
                </div>
              </div>

              <button 
                onClick={handleSaveDecision}
                disabled={isSavingDecision || decisionRationale.length < 20}
                className="w-full bg-astrix-teal text-white font-bold py-4 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSavingDecision ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Prompt Modal */}
      {showArtifactPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center animate-[fadeIn_0.2s_ease-out]">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Decision Saved!</h2>
            <p className="text-gray-600 font-medium mb-8">Would you like AI to generate an execution-ready artifact based on the evidence?</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleGenerateArtifact('prd')}
                disabled={isGeneratingArtifact}
                className="w-full bg-astrix-teal text-white font-bold py-3.5 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingArtifact ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate PRD (Markdown)'}
              </button>
              <button 
                onClick={() => handleGenerateArtifact('decision_memo')}
                disabled={isGeneratingArtifact}
                className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingArtifact ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Decision Memo'}
              </button>
              <button 
                onClick={() => { setShowArtifactPrompt(false); setSavedDecisionId(null); }}
                disabled={isGeneratingArtifact}
                className="w-full text-gray-500 font-bold py-3 hover:text-gray-900 transition-colors text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
};
