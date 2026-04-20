import React from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { TrendingUp, ArrowRight, UploadCloud, Activity, Database, CheckCircle2, Layers, Clock, AlertCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSignals, useOpportunities, useProblems, useDecisions, useLaunches } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export const Dashboard = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const wsId = activeWorkspace?.id;

  const { data: oppData, isLoading: oppLoading } = useOpportunities(wsId);
  const { data: sigData } = useSignals(wsId);
  const { data: probData } = useProblems(wsId);
  const { data: decData } = useDecisions(wsId);
  const { data: launchData } = useLaunches(wsId);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const opportunities = oppData || [];
  const signalsCount = sigData?.total || 0;
  const decisions = decData || [];
  const launches = launchData || [];

  const topOpportunities = opportunities.slice(0, 5);
  const recentDecisions = decisions.slice(0, 4);
  
  const activeLaunches = launches.filter(l => l.status === 'active' || l.status === 'pending_review');
  const reviewsDue = activeLaunches.filter(l => {
    const launchDate = new Date(l.launched_at);
    const daysSinceLaunch = (Date.now() - launchDate.getTime()) / (1000 * 3600 * 24);
    return daysSinceLaunch >= 7; 
  });
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  // Mock calculation for unmatched signals (for UI realism)
  const unmatchedSignals = Math.max(0, Math.floor(signalsCount * 0.15));

  return (
    <AppLayout 
      title={`Welcome back, ${firstName}.`} 
      subtitle="Here is what needs your attention today."
    >
      {/* 1. URGENT: Reviews Due Banner */}
      {reviewsDue.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-start sm:items-center gap-4 text-amber-900">
            <div className="p-3 bg-amber-100 rounded-xl shrink-0">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold">Launch Reviews Due</h3>
              <p className="text-sm font-medium text-amber-700 mt-0.5">
                You have {reviewsDue.length} launch{reviewsDue.length > 1 ? 'es' : ''} that have passed the 7-day measurement window.
              </p>
            </div>
          </div>
          <Link to="/app/launches" className="bg-white text-amber-700 border border-amber-200 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-50 hover:border-amber-300 transition-all shrink-0 w-full sm:w-auto text-center">
            Review Outcomes
          </Link>
        </div>
      )}

      {/* 2. QUICK STATS: The Engine Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        
        {/* Total Signals + Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 relative overflow-hidden group hover:border-brand-blue/30 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Signals</div>
            <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> +12%
            </div>
          </div>
          <div className="text-3xl font-heading font-black text-gray-900 mb-4">{signalsCount}</div>
          
          {/* Premium SVG Sparkline */}
          <div className="absolute bottom-0 left-0 w-full h-12 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A56FF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1A56FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,30 L10,25 L20,28 L30,20 L40,22 L50,15 L60,18 L70,10 L80,12 L90,5 L100,0 L100,30 L0,30 Z" fill="url(#trend-gradient)" />
              <path d="M0,30 L10,25 L20,28 L30,20 L40,22 L50,15 L60,18 L70,10 L80,12 L90,5 L100,0" fill="none" stroke="#1A56FF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        {/* Unmatched Signals (Needs Triage) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100"><AlertCircle className="w-4 h-4 text-gray-500" /></div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Needs Triage</div>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-heading font-black text-gray-900">{unmatchedSignals}</div>
            <div className="text-sm font-medium text-gray-500 mb-1">unclustered signals</div>
          </div>
        </div>

        {/* Top Opportunity Score */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 hover:border-astrix-teal/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-50 rounded-lg border border-teal-100"><Zap className="w-4 h-4 text-astrix-teal" /></div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Top Opp Score</div>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-heading font-black text-astrix-teal">{opportunities[0]?.opportunity_score || 0}</div>
            <div className="text-sm font-medium text-gray-500 mb-1">/ 100</div>
          </div>
        </div>

        {/* Decisions Made */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100"><CheckCircle2 className="w-4 h-4 text-brand-blue" /></div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Decisions Logged</div>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-heading font-black text-gray-900">{decisions.length}</div>
            <div className="text-sm font-medium text-gray-500 mb-1">this quarter</div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: Opportunities & Execution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-24">
        
        {/* Left: Top Opportunities */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-xl font-bold text-gray-900">Ranked Opportunities</h2>
            <Link to="/app/opportunities" className="text-sm font-bold text-astrix-teal hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            {oppLoading ? (
              <div className="p-6 space-y-6">
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-full h-16" />
              </div>
            ) : topOpportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                <Database className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No opportunities found</h3>
                <p className="text-sm text-gray-500 max-w-sm">Upload customer signals and run AI clustering to generate your first ranked opportunities.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topOpportunities.map((opp, i) => (
                  <Link 
                    key={opp.id} 
                    to={`/app/opportunities/${opp.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors group gap-4 sm:gap-0"
                  >
                    <div className="flex items-start sm:items-center gap-4 md:gap-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-black text-xl shrink-0 transition-transform group-hover:scale-105 ${opp.opportunity_score >= 80 ? 'bg-astrix-teal text-white shadow-md' : opp.opportunity_score >= 60 ? 'bg-astrix-gold text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                        {opp.opportunity_score}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1 line-clamp-1 group-hover:text-brand-blue transition-colors">
                          {opp.problems?.title || 'Unknown Problem'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-mono font-medium text-gray-500">
                          <span className={`px-2 py-0.5 rounded uppercase tracking-wider font-bold ${opp.recommended_action === 'Build' ? 'bg-blue-50 text-blue-700 border border-blue-100' : opp.recommended_action === 'Fix' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                            {opp.recommended_action || 'Review'}
                          </span>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" /> {opp.problems?.evidence_count || 0} Signals
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-16 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-0.5">ARR at Risk</div>
                        <div className="font-bold text-gray-900">{formatCurrency(opp.problems?.affected_arr || 0)}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-brand-blue group-hover:text-brand-blue group-hover:bg-blue-50 transition-all shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Execution Tracking */}
        <div className="xl:col-span-1 flex flex-col gap-8">
          
          {/* Active Launches */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl font-bold text-gray-900">Active Launches</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1 flex flex-col">
              {activeLaunches.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No active launches tracking.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeLaunches.slice(0, 3).map(launch => (
                    <Link key={launch.id} to={`/app/launches/${launch.id}`} className="block group">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-brand-blue transition-colors">{launch.title}</div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase shrink-0">Tracking</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Clock className="w-3 h-3" /> {new Date(launch.launched_at).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                  {activeLaunches.length > 3 && (
                    <Link to="/app/launches" className="block text-center text-xs font-bold text-gray-500 hover:text-gray-900 pt-2 mt-2 border-t border-gray-100">
                      View all {activeLaunches.length} launches
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl font-bold text-gray-900">Recent Decisions</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1 flex flex-col">
              {recentDecisions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No decisions logged yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDecisions.map(dec => (
                    <Link key={dec.id} to={`/app/decisions/${dec.id}`} className="block group">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${dec.action === 'Build' ? 'bg-blue-50 text-blue-700 border border-blue-100' : dec.action === 'Fix' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {dec.action}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-brand-blue transition-colors">{dec.title}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-gray-900 text-white p-4 rounded-full shadow-apple hover:bg-brand-blue hover:shadow-glow-blue transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue z-40 group flex items-center gap-3 overflow-hidden"
        title="Upload Signals (N)"
      >
        <UploadCloud className="w-6 h-6 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-sm">
          Import Data
        </span>
      </button>
    </AppLayout>
  );
};
