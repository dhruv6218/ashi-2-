import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { useAccount } from '../../lib/api';
import { Building2, Signal, AlertCircle, ArrowLeft, Calendar, BadgeDollarSign, HeartPulse } from 'lucide-react';

export const AccountDetail = () => {
  const { id } = useParams();
  const { data, isLoading } = useAccount(id);

  if (isLoading) {
    return (
      <AppLayout title="Loading Account...">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-astrix-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (!data || !data.account) {
    return (
      <AppLayout title="Account Not Found">
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Not Found</h2>
          <Link to="/app/accounts" className="text-brand-blue font-bold flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Accounts
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { account, signals, problems } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <AppLayout 
      title={account.name} 
      subtitle={account.domain || 'No domain set'}
      backPath="/app/accounts"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Account Info & Health */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-6">Account Vitals</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <BadgeDollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase">ARR</div>
                    <div className="text-lg font-black text-gray-900">{formatCurrency(account.arr)}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-brand-blue">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase">Health Score</div>
                    <div className="text-lg font-black text-gray-900">{account.health_score || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase">Renewal Date</div>
                    <div className="text-lg font-black text-gray-900">
                      {account.renewal_date ? new Date(account.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">Account Segment</h3>
            <div className="text-xl font-bold mb-2">{account.plan || 'Standard'}</div>
            <p className="text-sm text-gray-400">High priority account. Part of the '{account.plan || 'Standard'}' customer segment defined in space settings.</p>
          </div>
        </div>

        {/* Middle/Right Column: Evidence & Impacts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Affected Problems */}
          <div>
            <h3 className="font-heading text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Active Problems ({problems.length})
            </h3>
            {problems.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500 font-medium">
                No active problems detected for this account.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {problems.map((prob: any) => (
                  <Link key={prob.id} to={`/app/problems/${prob.id}`} className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-brand-blue transition-all group shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-brand-blue transition-colors line-clamp-1">{prob.title}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${prob.severity === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                        {prob.severity}
                      </span>
                      <span className="text-gray-400 font-medium">{prob.evidence_count} Signals</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Raw Signals Source */}
          <div>
            <h3 className="font-heading text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Signal className="w-5 h-5 text-brand-blue" />
              Recent Signals ({signals.length})
            </h3>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {signals.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium italic">No signals recorded for this account.</div>
                ) : (
                  signals.map((sig: any) => (
                    <div key={sig.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{sig.source_type}</span>
                        <span className="text-xs text-gray-400 font-medium">{new Date(sig.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-2 italic">"{sig.raw_text}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};
