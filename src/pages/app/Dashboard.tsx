import React from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { 
  TrendingUp, 
  ArrowRight, 
  UploadCloud, 
  Activity, 
  Database, 
  CheckCircle2, 
  Layers, 
  Clock, 
  AlertCircle, 
  Zap,
  Sparkles,
  PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useSignals, 
  useOpportunities, 
  useDecisions, 
  useLaunches 
} from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

export const Dashboard = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const wsId = activeWorkspace?.id;

  const { data: oppData, isLoading: oppLoading } = useOpportunities(wsId);
  const { data: sigData } = useSignals(wsId);
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

  const unmatchedSignals = Math.max(0, Math.floor(signalsCount * 0.15));

  // Dynamic Decision Alpha Calculation
  const solvedLaunches = launches.filter(l => l.pm_verdict === 'Solved').length;
  const decisionAlpha = launches.length > 0 ? Math.round((solvedLaunches / launches.length) * 100) : 0;

  return (
    <AppLayout 
      title={`Welcome back, ${firstName}.`} 
      subtitle="Here is what needs your attention today."
    >
      {/* 1. URGENT: Reviews Due Banner - Premium Glassmorphism */}
      {reviewsDue.length > 0 && (
        <div className="mb-8 relative overflow-hidden rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-amber-200/60 bg-gradient-to-br from-amber-50/90 to-orange-50/50 backdrop-blur-md animate-[fadeIn_0.4s_ease-out]">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-orange-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-start sm:items-center gap-5 text-amber-900 relative z-10">
            <div className="p-3.5 bg-white/60 backdrop-blur-sm rounded-2xl shrink-0 shadow-sm border border-amber-100/50">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold tracking-tight">Launch Reviews Due</h3>
              <p className="text-sm font-medium text-amber-700/80 mt-1">
                You have {reviewsDue.length} launch{reviewsDue.length > 1 ? 'es' : ''} that have passed the 7-day measurement window.
              </p>
            </div>
          </div>
          <Link to="/app/launches" className="relative z-10 bg-white text-amber-700 border border-amber-200/50 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:bg-amber-50/50 hover:border-amber-300 transition-all duration-300 shrink-0 w-full sm:w-auto text-center">
            Review Outcomes
          </Link>
        </div>
      )}

      {/* 2. MAIN CONTENT: Opportunities & Execution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        
        {/* Left: Top Opportunities */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="font-heading text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-astrix-teal" /> Top Opportunities
            </h2>
            <Link to="/app/opportunities" className="text-sm font-bold text-astrix-teal hover:text-astrix-darkTeal transition-colors flex items-center gap-1 group">
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-200/60 shadow-apple overflow-hidden flex-1 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-astrix-teal via-brand-blue to-purple-500 opacity-80"></div>
            
            {oppLoading ? (
              <div className="p-8 space-y-8">
                <Skeleton className="w-full h-16 rounded-2xl" />
                <Skeleton className="w-full h-16 rounded-2xl" />
                <Skeleton className="w-full h-16 rounded-2xl" />
              </div>
            ) : topOpportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                  <Database className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No opportunities found</h3>
                <p className="text-sm text-gray-500 font-medium max-w-sm">Upload customer signals and run AI clustering to generate your first ranked opportunities.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/80">
                {topOpportunities.map((opp, index) => (
                  <Link 
                    key={opp.id} 
                    to={`/app/opportunities/${opp.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50/80 transition-all duration-300 group gap-4 sm:gap-0 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-astrix-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="flex items-start sm:items-center gap-5 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-black text-xl shrink-0 transition-all duration-500 group-hover:scale-105 group-hover:shadow-md ${opp.opportunity_score >= 80 ? 'bg-gradient-to-br from-astrix-teal to-teal-600 text-white shadow-sm border border-teal-500/20' : opp.opportunity_score >= 60 ? 'bg-gradient-to-br from-astrix-gold to-yellow-500 text-gray-900 shadow-sm border border-yellow-400/20' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {opp.opportunity_score}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1.5 line-clamp-1 group-hover:text-astrix-teal transition-colors">
                          {opp.problems?.title || 'Unknown Problem'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-mono font-medium text-gray-500">
                          <span className={`px-2.5 py-1 rounded-md uppercase tracking-wider font-bold ${opp.recommended_action === 'Build' ? 'bg-blue-50 text-blue-700 border border-blue-100/50' : opp.recommended_action === 'Fix' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100/50' : 'bg-gray-100 text-gray-700 border border-gray-200/50'}`}>
                            {opp.recommended_action || 'Review'}
                          </span>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <Layers className="w-3.5 h-3.5 text-gray-400" /> {opp.problems?.evidence_count || 0} Signals
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pl-19 sm:pl-0 relative z-10">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-gray-400 uppercase font-bold mb-1 tracking-widest">ARR at Risk</div>
                        <div className="font-bold text-gray-900 text-base">{formatCurrency(opp.problems?.affected_arr || 0)}</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-astrix-teal group-hover:text-astrix-teal group-hover:bg-teal-50 transition-all duration-300 shrink-0 shadow-sm group-hover:shadow">
                        <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
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
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading text-lg font-bold text-gray-900">Active Launches</h2>
              <Link to="/app/launches" className="text-xs font-bold text-gray-400 hover:text-astrix-teal transition-colors uppercase tracking-widest">See all</Link>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200/60 shadow-apple p-6 flex-1 flex flex-col relative overflow-hidden group hover:shadow-apple-hover transition-shadow duration-500">
              {activeLaunches.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No active launches.</p>
                </div>
              ) : (
                <div className="space-y-5 relative z-10">
                  {activeLaunches.slice(0, 3).map(launch => (
                    <Link key={launch.id} to={`/app/launches/${launch.id}`} className="block group/item border-b border-gray-50/80 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover/item:text-astrix-teal transition-colors">{launch.title}</div>
                        <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">Tracking</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {new Date(launch.launched_at).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading text-lg font-bold text-gray-900">Recent Decisions</h2>
              <Link to="/app/decisions" className="text-xs font-bold text-gray-400 hover:text-astrix-teal transition-colors uppercase tracking-widest">History</Link>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200/60 shadow-apple p-6 flex-1 flex flex-col relative overflow-hidden group hover:shadow-apple-hover transition-shadow duration-500">
              {recentDecisions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No decisions logged.</p>
                </div>
              ) : (
                <div className="space-y-5 relative z-10">
                  {recentDecisions.map(dec => (
                    <Link key={dec.id} to={`/app/decisions/${dec.id}`} className="block group/item border-b border-gray-50/80 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${dec.action === 'Build' ? 'bg-blue-50 text-blue-700 border-blue-100/50' : dec.action === 'Fix' ? 'bg-yellow-50 text-yellow-700 border-yellow-100/50' : 'bg-gray-50 text-gray-600 border-gray-200/50'}`}>
                          {dec.action}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono font-medium">{new Date(dec.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 line-clamp-1 group-hover/item:text-astrix-teal transition-colors">{dec.title}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 3. PERFORMANCE STATS: Bottom context */}
      <h2 className="font-heading text-xl font-bold text-gray-900 mb-5 px-1">Workspace Pulse</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-12">
        
        {/* Total Signals + Quota */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-apple hover:-translate-y-1 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm group-hover:bg-white transition-colors"><PieChart className="w-4.5 h-4.5 text-gray-500" /></div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Signal Quota</div>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <div className="text-3xl font-heading font-black text-gray-900">{signalsCount}</div>
              <div className="text-sm font-medium text-gray-500 mb-1.5">/ 200 used</div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: `${Math.min(100, (signalsCount / 200) * 100)}%` }}></div>
            </div>
            <div className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mt-3">Free Plan</div>
          </div>
        </div>

        {/* Unmatched Signals (Needs Triage) */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-apple hover:-translate-y-1 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm group-hover:bg-white transition-colors"><AlertCircle className="w-4.5 h-4.5 text-gray-500" /></div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unmatched Signals</div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-heading font-black text-gray-900">{unmatchedSignals}</div>
              <div className="text-sm font-medium text-gray-500 mb-1.5">needs triage</div>
            </div>
          </div>
        </div>

        {/* Top Opportunity Score */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-apple hover:-translate-y-1 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100 shadow-sm group-hover:bg-white transition-colors"><Zap className="w-4.5 h-4.5 text-astrix-teal" /></div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Max Opp Score</div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-heading font-black text-astrix-teal">{opportunities[0]?.opportunity_score || 0}</div>
              <div className="text-sm font-medium text-gray-500 mb-1.5">priority index</div>
            </div>
          </div>
        </div>

        {/* Decisions Made */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-sm p-6 relative overflow-hidden group hover:shadow-apple hover:-translate-y-1 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm group-hover:bg-white transition-colors"><CheckCircle2 className="w-4.5 h-4.5 text-brand-blue" /></div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Decision Alpha</div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-heading font-black text-gray-900">{decisionAlpha}%</div>
              <div className="text-sm font-medium text-gray-500 mb-1.5">proof accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-gray-900 text-white p-4 rounded-full shadow-apple hover:bg-brand-blue hover:shadow-glow-blue transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue z-40 group flex items-center gap-3 overflow-hidden hover:-translate-y-1"
        title="Upload Signals (N)"
      >
        <UploadCloud className="w-6 h-6 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-bold text-sm">
          Import Data
        </span>
      </button>
    </AppLayout>
  );
};
