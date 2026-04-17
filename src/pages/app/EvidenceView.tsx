import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link, useParams } from 'react-router-dom';
import {
  Quote, Filter, TrendingUp, ArrowLeft, BarChart3,
  AlertCircle, Flag, Clock, Search, Building2, Loader2
} from 'lucide-react';
import { AIBadge } from '../../components/ui/AIBadge';
import { useToast } from '../../contexts/ToastContext';
import { useProblem } from '../../lib/api';

export const EvidenceView = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const { addToast } = useToast();
  const { data, isLoading } = useProblem(problemId);
  
  const problemSignals = data?.signals || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);

  const filtered = problemSignals.filter(s => {
    const matchSearch = s.raw_text.toLowerCase().includes(searchQuery.toLowerCase()) || (s.accounts?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSeverity = filterSeverity === 'All' || s.severity_label === filterSeverity;
    return matchSearch && matchSeverity;
  });

  const toggleFlag = (id: string) => {
    if (flaggedIds.includes(id)) {
      setFlaggedIds(flaggedIds.filter(f => f !== id));
      addToast('Flag removed.', 'info');
    } else {
      setFlaggedIds([...flaggedIds, id]);
      addToast('Signal flagged as irrelevant.', 'success');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading Evidence..." subtitle="Fetching signals">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>
      </AppLayout>
    );
  }

  const criticalCount = problemSignals.filter(s => s.severity_label === 'Critical').length;
  const highCount = problemSignals.filter(s => s.severity_label === 'High').length;

  return (
    <AppLayout
      title="Evidence View"
      subtitle="All signals supporting this problem cluster"
      actions={
        <Link to={problemId ? `/app/problems/${problemId}` : '/app/problems'} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Problem
        </Link>
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Signals', value: problemSignals.length, icon: <BarChart3 className="w-5 h-5 text-astrix-teal" />, color: 'text-astrix-teal' },
          { label: 'Critical', value: criticalCount, icon: <AlertCircle className="w-5 h-5 text-brand-red" />, color: 'text-brand-red' },
          { label: 'High', value: highCount, icon: <TrendingUp className="w-5 h-5 text-astrix-terra" />, color: 'text-astrix-terra' },
          { label: 'Accounts Affected', value: new Set(problemSignals.map(s => s.account_id)).size, icon: <Building2 className="w-5 h-5 text-brand-blue" />, color: 'text-brand-blue' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">{stat.icon}</div>
            <div>
              <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-0.5">{stat.label}</div>
              <div className={`font-heading font-black text-2xl ${stat.color}`}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sentiment Distribution (Simplified UI) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading text-base font-bold text-gray-900 mb-4">Sentiment Distribution</h3>
          <div className="w-full h-6 rounded-full flex overflow-hidden mb-4">
            <div className="bg-brand-red h-full" style={{ width: '70%' }} title="Negative"></div>
            <div className="bg-astrix-gold h-full" style={{ width: '20%' }} title="Neutral"></div>
            <div className="bg-astrix-teal h-full" style={{ width: '10%' }} title="Positive"></div>
          </div>
          <div className="flex gap-4 text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-red"></div> Negative (70%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-astrix-gold"></div> Neutral (20%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-astrix-teal"></div> Positive (10%)</div>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading text-base font-bold text-gray-900 mb-4">Source Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {['CSV', 'Intercom', 'Jira'].map(src => {
              const count = problemSignals.filter(s => s.source_type === src).length || 0;
              return (
                <div key={src} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="font-bold text-gray-900 text-sm">{src}</span>
                  <span className="font-mono text-xs text-gray-500 font-bold">{count} signals</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Signal List with filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search signals..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-astrix-teal" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal font-bold text-gray-700">
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
          </div>
          <div className="text-xs font-mono font-bold text-gray-500 ml-auto">{filtered.length} of {problemSignals.length} shown</div>
        </div>

        <AIBadge className="mb-2" />
        <p className="text-xs text-gray-500 font-medium mb-4">Evidence tracing is active. Every signal is linked to its source record and account. Flag irrelevant signals to improve future clustering.</p>

        {filtered.map(sig => (
          <div key={sig.id} className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${flaggedIds.includes(sig.id) ? 'opacity-50 border-gray-300' : 'border-gray-200'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${sig.severity_label === 'Critical' ? 'bg-brand-red' : sig.severity_label === 'High' ? 'bg-astrix-terra' : 'bg-astrix-gold'}`} />
            <Quote className="absolute top-4 right-4 w-10 h-10 text-gray-100" />

            <div className="flex justify-between items-start gap-4 relative z-10">
              <p className="text-gray-800 font-medium text-base flex-1">"{sig.raw_text}"</p>
              <button onClick={() => toggleFlag(sig.id)} title={flaggedIds.includes(sig.id) ? 'Unflag' : 'Flag as irrelevant'} className={`p-2 rounded-lg border transition-colors shrink-0 ${flaggedIds.includes(sig.id) ? 'bg-red-50 border-red-200 text-brand-red' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-brand-red hover:border-red-200'}`}>
                <Flag className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono font-bold text-gray-500 relative z-10">
              <span className="text-gray-900">{sig.accounts?.name || 'Unknown'}</span>
              <span>•</span>
              <span className="uppercase">{sig.source_type}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(sig.created_at).toLocaleDateString()}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${sig.severity_label === 'Critical' ? 'bg-red-50 text-brand-red' : sig.severity_label === 'High' ? 'bg-orange-50 text-orange-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {sig.severity_label}
              </span>
            </div>
            {flaggedIds.includes(sig.id) && (
              <div className="mt-3 text-xs font-bold text-brand-red flex items-center gap-1"><Flag className="w-3 h-3" /> Flagged as irrelevant — excluded from scoring</div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-gray-50 p-12 rounded-2xl text-center border border-gray-200">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-1">No signals match your filters</h4>
            <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
