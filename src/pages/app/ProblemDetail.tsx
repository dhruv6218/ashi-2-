import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { AlertCircle, TrendingUp, TrendingDown, Radio, ArrowRight, Quote, Loader2, Building2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useProblem } from '../../lib/api';

export const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useProblem(id);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = ['Overview', 'Evidence', 'Accounts'];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading Problem..." subtitle="Fetching AI analysis and evidence">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>
      </AppLayout>
    );
  }

  if (!data || !data.problem) {
    return (
      <AppLayout title="Problem Not Found" subtitle="Could not load data">
        <div className="flex items-center justify-center h-64 text-gray-500">Problem does not exist or you don't have access.</div>
      </AppLayout>
    );
  }

  const { problem: currentProblem, signals: problemSignals, accounts: problemAccounts } = data;
  const totalArrRisk = problemAccounts.reduce((sum, acc) => sum + Number(acc.arr), 0);

  return (
    <AppLayout 
      title={currentProblem.title} 
      subtitle={`Canonical Problem • Created ${formatDate(currentProblem.created_at)}`}
      actions={
        <Link to="/app/opportunities" className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center mt-2 sm:mt-0">
          View Opportunities <ArrowRight className="w-4 h-4" />
        </Link>
      }
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-wrap gap-6 md:gap-16">
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Severity</div>
          <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md text-sm ${currentProblem.severity === 'Critical' ? 'bg-red-50 text-brand-red' : currentProblem.severity === 'High' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-700'}`}>
            {currentProblem.severity === 'Critical' && <AlertCircle className="w-4 h-4" />} 
            {currentProblem.severity || 'Medium'}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Signals</div>
          <div className="font-heading font-black text-2xl text-gray-900">{currentProblem.evidence_count}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Affected ARR</div>
          <div className="font-heading font-black text-2xl text-brand-blue">{formatCurrency(currentProblem.affected_arr)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Trend</div>
          <div className="flex items-center gap-1 font-bold text-lg">
            {currentProblem.trend === 'Rising' ? <><TrendingUp className="w-5 h-5 text-brand-red" /><span className="text-brand-red">Rising</span></> : 
             currentProblem.trend === 'Declining' ? <><TrendingDown className="w-5 h-5 text-green-500" /><span className="text-green-500">Declining</span></> : 
             <><div className="w-4 h-[2px] bg-gray-400"></div><span className="text-gray-500">Stable</span></>}
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap focus-visible:outline-none ${
              activeTab === tab.toLowerCase() ? 'text-brand-blue' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
            {activeTab === tab.toLowerCase() && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full animate-[fadeIn_0.2s_ease-out]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="animate-[fadeIn_0.3s_ease-out]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-brand-blue/10 text-brand-blue p-1.5 rounded-lg"><Radio className="w-4 h-4" /></span>
                  AI Summary
                </h3>
                <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {currentProblem.description || 'No description generated.'}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-xs font-mono text-gray-400 uppercase font-bold mb-3">Product Area</h4>
                <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold">{currentProblem.product_area || 'Uncategorized'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Raw Signals ({problemSignals.length})</h3>
            {problemSignals.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-2xl text-center text-gray-500 font-medium border border-gray-200">
                No signals linked to this problem yet.
              </div>
            ) : (
              problemSignals.map((sig) => (
                <div key={sig.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${sig.severity_label === 'Critical' ? 'bg-brand-red' : 'bg-brand-yellow'}`}></div>
                  <Quote className="absolute top-4 right-4 w-12 h-12 text-gray-50 opacity-50" />
                  <p className="text-gray-800 font-medium text-base md:text-lg mb-4 relative z-10">
                    "{sig.raw_text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-gray-500">
                    <span className="text-gray-900">{sig.accounts?.name || 'Unknown Account'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="uppercase">{sig.source_type}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{formatDate(sig.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-gray-900">Affected Accounts</h3>
                <p className="text-gray-500 text-sm font-medium mt-1">
                  <span className="font-bold text-gray-900">{problemAccounts.length}</span> accounts affected — <span className="font-bold text-brand-blue">{formatCurrency(totalArrRisk)}</span> ARR at risk
                </p>
              </div>
            </div>

            {problemAccounts.length === 0 ? (
              <div className="bg-gray-50 p-10 rounded-2xl text-center border border-gray-200">
                <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold mb-1">No accounts linked yet.</h4>
                <p className="text-gray-500 text-sm mb-4">Upload your account list to see which customers are affected.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 font-mono text-xs text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-semibold">Account Name</th>
                        <th className="p-4 font-semibold">ARR</th>
                        <th className="p-4 font-semibold">Plan</th>
                        <th className="p-4 font-semibold">Churn Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {problemAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{acc.name}</td>
                          <td className="p-4 font-mono font-bold text-brand-blue">{formatCurrency(acc.arr)}</td>
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{acc.plan || 'Standard'}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${acc.health_score === 'High' ? 'bg-red-100 text-red-700' : acc.health_score === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {acc.health_score || 'Low'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
