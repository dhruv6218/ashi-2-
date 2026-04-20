import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link, useParams } from 'react-router-dom';
import { Rocket, CheckCircle2, Clock, ArrowLeft, Save, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useLaunches, api } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const LaunchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { data: launches } = useLaunches(activeWorkspace?.id);

  const [formData, setFormData] = useState({ 
    expected_outcome: '', 
    before_count: '', 
    after_count: '', 
    pm_verdict: '', 
    notes: '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const launch = launches.find(l => l.id === id);

  useEffect(() => {
    if (launch) {
      setFormData({
        expected_outcome: launch.expected_outcome || '',
        before_count: launch.before_count?.toString() || '',
        after_count: launch.after_count?.toString() || '',
        pm_verdict: launch.pm_verdict || '',
        notes: launch.notes || ''
      });
    }
  }, [launch]);

  const handleSaveOutcome = async () => {
    if (!id || !activeWorkspace) return;
    setIsSaving(true);
    try {
      await api.launches.update(id, {
        expected_outcome: formData.expected_outcome,
        before_count: parseInt(formData.before_count) || 0,
        after_count: parseInt(formData.after_count) || 0,
        pm_verdict: formData.pm_verdict,
        notes: formData.notes
      });
      addToast(`Launch outcome saved successfully!`, 'success');
    } catch (err: any) {
      addToast(err.message || "Failed to save outcome", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!launch) {
    return <AppLayout title="Loading..."><div className="p-8 text-center text-gray-500">Launch not found or loading...</div></AppLayout>;
  }

  return (
    <AppLayout
      title="Launch Details"
      subtitle="Post-Launch Tracking"
      actions={
        <Link to="/app/launches" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> All Launches
        </Link>
      }
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-blue/10 transition-colors duration-500"></div>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors ${launch.pm_verdict ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-brand-blue border-blue-200'}`}>
                {launch.action}
              </span>
              <span className="text-[10px] font-mono text-gray-400 font-bold tracking-widest uppercase">Launch ID: {launch.id.substring(0, 8)}</span>
            </div>
            <h2 className="font-heading text-3xl font-black text-gray-900 mb-3 tracking-tight">{launch.title}</h2>
            <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><Rocket className="w-4 h-4 text-brand-blue" /> Launched {new Date(launch.launched_at).toLocaleDateString()}</span>
              <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> Tracking Window: 30 Days</span>
            </div>
          </div>
          
          <div className="flex gap-6">
             <div className="text-right">
                <div className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mb-1.5">Measurement Window</div>
                <div className="flex items-center justify-end gap-3">
                   <div className="flex flex-col items-center">
                     <span className={`text-[10px] font-bold ${launch.before_count ? 'text-green-600' : 'text-gray-400'}`}>D7</span>
                     <div className={`w-2 h-2 rounded-full mt-1 ${launch.before_count ? 'bg-green-500 shadow-glow-green' : 'bg-gray-200'}`}></div>
                   </div>
                   <div className="w-8 h-[2px] bg-gray-100 mt-3"></div>
                   <div className="flex flex-col items-center">
                     <span className={`text-[10px] font-bold ${launch.after_count ? 'text-green-600' : 'text-gray-400'}`}>D30</span>
                     <div className={`w-2 h-2 rounded-full mt-1 ${launch.after_count ? 'bg-green-500 shadow-glow-green' : 'bg-gray-200'}`}></div>
                   </div>
                   <div className="w-8 h-[2px] bg-gray-100 mt-3"></div>
                   <div className="flex flex-col items-center">
                     <span className={`text-[10px] font-bold ${launch.pm_verdict ? 'text-astrix-teal' : 'text-gray-400'}`}>Final</span>
                     <div className={`w-2 h-2 rounded-full mt-1 ${launch.pm_verdict ? 'bg-astrix-teal shadow-glow-blue' : 'bg-gray-200'}`}></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Review Checkpoints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Day 7 Card */}
             <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Day 7 Review</h4>
                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-100">Baseline Set</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Baseline Signal Count</span>
                    <div className="text-2xl font-black text-gray-900 mt-0.5">{launch.before_count || '--'}</div>
                  </div>
                  <div className="pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-500 italic">"Initial signals stabilized. Majority of feedback related to {launch.title.split(' ')[0]} friction."</p>
                  </div>
                </div>
             </div>

             {/* Day 30 Card */}
             <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${launch.after_count ? 'border-gray-200 opacity-100' : 'border-dashed border-gray-300 opacity-60'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Day 30 Review</h4>
                  {!launch.after_count && <span className="text-[10px] font-bold text-gray-400 italic">In Progress</span>}
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Reduced to</span>
                    <div className="text-2xl font-black text-gray-900 mt-0.5">{launch.after_count || '--'}</div>
                  </div>
                  {launch.after_count && launch.before_count && (
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-4 h-4 rotate-180" />
                      <span className="text-xs font-bold">-{Math.round(((launch.before_count - launch.after_count) / launch.before_count) * 100)}% reduction in friction</span>
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-astrix-teal" /> Final Verdict & Proof Summary
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Hypothesis & Expected Outcome</label>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-700 leading-relaxed italic">
                  "{formData.expected_outcome || 'No expected outcome defined.'}"
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Target Metric Delta</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Before</div>
                        <div className="text-xl font-black text-gray-900">{launch.before_count || 0}</div>
                    </div>
                    <div className="text-gray-300 font-black text-xl">→</div>
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">After</div>
                        <div className="text-xl font-black text-gray-900">{launch.after_count || 0}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                      Verdict <span className="text-red-500">*</span>
                   </label>
                   <select 
                    required
                    value={formData.pm_verdict} 
                    onChange={e => setFormData({ ...formData, pm_verdict: e.target.value })} 
                    className={`w-full bg-white border rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-astrix-teal/20 transition-all ${formData.pm_verdict ? 'border-astrix-teal text-astrix-teal' : 'border-gray-200 text-gray-900 font-medium'}`} 
                   >
                     <option value="" disabled>Select a verdict...</option>
                     <option value="Solved">✓ Solved</option>
                     <option value="Partially Solved">~ Partially Solved</option>
                     <option value="Not Solved">✗ Not Solved</option>
                     <option value="Regressed">! Regressed</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Closing PM Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                  placeholder="Summarize why this verdict was chosen..."
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-astrix-teal/20 transition-all resize-none min-h-[120px]" 
                />
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveOutcome} 
                  disabled={isSaving || !formData.pm_verdict} 
                  className="bg-gray-900 text-white px-8 py-3 rounded-full text-base font-bold hover:bg-brand-blue disabled:opacity-50 transition-all shadow-apple hover:shadow-glow-blue flex items-center gap-2 group"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  Submit Final Verdict
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Evidence Link */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="font-heading text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 group-hover:text-gray-400 transition-colors">Linked Decision Memo</h3>
            <p className="text-white font-bold text-base mb-4 leading-tight">Implementing account-aware filtering for better clarity.</p>
            <Link to="/app/artifacts" className="text-brand-blue text-xs font-bold flex items-center gap-2 hover:underline">
              View Memo <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Launch Checklist</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 rounded bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                   <span className="text-sm font-medium text-gray-700">Baseline captured</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 rounded bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                   <span className="text-sm font-medium text-gray-700">Day 7 review complete</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${launch.after_count ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-300 border-gray-200'}`}>
                      {launch.after_count ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1 h-1 rounded-full bg-gray-300"></div>}
                   </div>
                   <span className={`text-sm font-medium transition-colors ${launch.after_count ? 'text-gray-700' : 'text-gray-400'}`}>Day 30 review complete</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${launch.pm_verdict ? 'bg-astrix-teal text-white border-astrix-teal' : 'bg-gray-50 text-gray-300 border-gray-200'}`}>
                      {launch.pm_verdict ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1 h-1 rounded-full bg-gray-300"></div>}
                   </div>
                   <span className={`text-sm font-bold transition-colors ${launch.pm_verdict ? 'text-astrix-teal' : 'text-gray-400'}`}>Final verdict submitted</span>
                </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tracking Team</h3>
            <div className="flex -space-x-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                   {i === 1 ? 'JD' : i === 2 ? 'SL' : 'KS'}
                 </div>
               ))}
               <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-300">+2</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
