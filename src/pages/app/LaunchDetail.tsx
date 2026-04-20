import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Link, useParams } from 'react-router-dom';
import { Rocket, CheckCircle2, Clock, ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border bg-blue-50 text-brand-blue border-blue-200">
                {launch.action}
              </span>
            </div>
            <h2 className="font-heading text-2xl font-black text-gray-900 mb-3">{launch.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-gray-500">
              <span className="flex items-center gap-1.5"><Rocket className="w-4 h-4" /> Launched {new Date(launch.launched_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Day 14 of 30 tracking window</span>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-gray-400 uppercase">Review Status</div>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                   <span className="text-sm font-bold text-gray-900">Day 7 Passed</span>
                </div>
             </div>
             <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-gray-400 uppercase">Next Milestone</div>
                <div className="flex items-center gap-2 mt-1 text-gray-400">
                   <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                   <span className="text-sm font-bold">Day 30 Review</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-astrix-teal" /> Record Outcome
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Expected Outcome (Hypothesis)</label>
                <textarea 
                  value={formData.expected_outcome} 
                  onChange={e => setFormData({ ...formData, expected_outcome: e.target.value })} 
                  placeholder="e.g. Reduce support tickets related to filtering by 30%..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-astrix-teal min-h-[80px] resize-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Signal Count (Before Launch)</label>
                  <input 
                    type="number" 
                    value={formData.before_count} 
                    onChange={e => setFormData({ ...formData, before_count: e.target.value })} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-astrix-teal" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Signal Count (After Launch)</label>
                  <input 
                    type="number" 
                    value={formData.after_count} 
                    onChange={e => setFormData({ ...formData, after_count: e.target.value })} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-astrix-teal" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 whitespace-nowrap">
                   Final Verdict <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  value={formData.pm_verdict} 
                  onChange={e => setFormData({ ...formData, pm_verdict: e.target.value })} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-astrix-teal font-medium" 
                >
                  <option value="" disabled>Select a verdict...</option>
                  <option value="Solved">Solved</option>
                  <option value="Partially Solved">Partially Solved</option>
                  <option value="Not Solved">Not Solved</option>
                  <option value="Regressed">Regressed</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Self-accountability: This verdict will be permanently linked to this decision artifact.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Outcome Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-astrix-teal resize-none min-h-[100px]" 
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                  onClick={handleSaveOutcome} 
                  disabled={isSaving || !formData.pm_verdict} 
                  className="bg-astrix-teal text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-astrix-darkTeal disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Outcome
                </button>
              </div>
            </div>
          </div>

          {launch.pm_verdict && (
            <div className="bg-gradient-to-br from-astrix-teal/10 to-blue-50 border border-astrix-teal/20 rounded-2xl p-6 md:p-8 shadow-sm animate-[fadeIn_0.5s_ease-out]">
              <h3 className="font-heading text-lg font-bold text-astrix-teal mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Auto-Generated Proof Summary
              </h3>
              <div className="bg-white/60 border border-white rounded-xl p-5 space-y-4">
                <p className="text-gray-800 font-medium">
                  <strong>Decision:</strong> The team decided to {launch.action} <em>{launch.title}</em>.
                </p>
                <p className="text-gray-800 font-medium">
                  <strong>Outcome:</strong> After the measurement window, the final verdict is <span className="font-bold text-gray-900">{launch.pm_verdict}</span>.
                </p>
                <p className="text-gray-800 font-medium">
                  <strong>Metrics:</strong> The signal count changed from <span className="font-bold">{launch.before_count || 0}</span> to <span className="font-bold">{launch.after_count || 0}</span>.
                </p>
                {launch.notes && (
                  <div className="pt-3 border-t border-gray-200/50">
                    <p className="text-gray-600 text-sm italic">"{launch.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Launch Metadata</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Decision</span>
                <span className="font-bold text-astrix-teal truncate max-w-[140px] text-right">
                  {launch.title}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Action</span>
                <span className="font-bold text-gray-900">{launch.action}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Launch Date</span>
                <span className="font-bold text-gray-900">{new Date(launch.launched_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
