import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { CheckCircle2, FileText, Activity, Clock, Loader2, ChevronDown, Copy, Edit2, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useDecision, useArtifacts, useLaunches, api } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { AIBadge } from '../../components/ui/AIBadge';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';

export const DecisionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();

  const { data: currentDecision, isLoading } = useDecision(id);
  const { data: artifacts, refetch: fetchArtifacts } = useArtifacts(activeWorkspace?.id);
  const { data: launches } = useLaunches(activeWorkspace?.id);

  // Artifact State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Launch State
  const [showLaunchForm, setShowLaunchForm] = useState(false);
  const [launchDate, setLaunchDate] = useState('');
  const [isSavingLaunch, setIsSavingLaunch] = useState(false);

  const decisionArtifacts = artifacts.filter(a => a.decision_id === id);
  const decisionLaunches = launches.filter(l => l.decision_id === id);
  const activeArtifact = decisionArtifacts[0];

  const handleGenerateArtifact = async (type: string) => {
    if (!activeWorkspace || !id || !user) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 3000)); // Simulate AI
      await api.artifacts.create({
        workspace_id: activeWorkspace.id,
        decision_id: id,
        title: type === 'prd' ? 'Generated PRD' : 'Decision Memo',
        type: type,
        content: '# Generated Content\n\nAI generated this based on the decision.',
        author_id: user.id
      });
      
      await fetchArtifacts();
      addToast("Artifact generated successfully via AI", "success");
    } catch (err: any) {
      addToast("Failed to generate artifact.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeArtifact || !user) return;
    try {
      await api.artifacts.update(activeArtifact.id, { content: editContent });
      addToast("Changes saved successfully", "success");
      setIsEditing(false);
    } catch (err: any) {
      addToast("Failed to save changes", "error");
    }
  };

  const handleLogLaunch = async () => {
    if (!activeWorkspace || !id || !user || !launchDate || !currentDecision) return;
    setIsSavingLaunch(true);
    try {
      await api.launches.create({
        workspace_id: activeWorkspace.id,
        decision_id: id,
        title: currentDecision.title,
        action: currentDecision.action,
        launched_at: new Date(launchDate).toISOString(),
        created_by: user.id
      });
      
      addToast("Launch logged successfully", "success");
      setShowLaunchForm(false);
    } catch (err: any) {
      addToast(err.message || "Failed to log launch", "error");
    } finally {
      setIsSavingLaunch(false);
    }
  };

  const copyToClipboard = () => {
    if (activeArtifact) {
      navigator.clipboard.writeText(activeArtifact.content);
      addToast("Copied to clipboard", "success");
    }
  };

  if (isLoading) return <AppLayout title="Loading..."><Skeleton className="w-full h-64" /></AppLayout>;
  if (!currentDecision) return <AppLayout title="Not Found"><div className="p-8 text-center">Decision not found.</div></AppLayout>;

  const hasLaunch = decisionLaunches.length > 0;
  const launch = decisionLaunches[0];

  return (
    <AppLayout title={`Decision: ${currentDecision.title}`} subtitle="Permanent paper trail">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <span className={`px-3 py-1 rounded-md uppercase tracking-wider font-bold text-sm inline-flex items-center gap-2 mb-6 ${currentDecision.action === 'Build' ? 'bg-blue-100 text-blue-700' : currentDecision.action === 'Fix' ? 'bg-yellow-100 text-yellow-700' : currentDecision.action === 'Reject' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              <CheckCircle2 className="w-4 h-4" /> Action: {currentDecision.action}
            </span>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-3">Rationale</h3>
            <div className="bg-gray-50 border-l-4 border-astrix-teal p-5 rounded-r-xl text-gray-700 font-medium whitespace-pre-wrap">
              "{currentDecision.rationale}"
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-astrix-teal" /> Artifacts
              </h3>
              {decisionArtifacts.length === 0 && !isGenerating && (
                <div className="flex gap-2">
                  <button onClick={() => handleGenerateArtifact('prd')} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700">
                    Generate PRD
                  </button>
                  <button onClick={() => handleGenerateArtifact('decision_memo')} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">
                    Memo
                  </button>
                </div>
              )}
            </div>
            
            {isGenerating ? (
              <div className="space-y-3"><Skeleton className="w-full h-4" /><Skeleton className="w-3/4 h-4" /><Skeleton className="w-1/2 h-4" /></div>
            ) : decisionArtifacts.length > 0 && activeArtifact ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">
                    <AIBadge /> {activeArtifact.title}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2">Cancel</button>
                        <button onClick={handleSaveEdit} className="text-xs font-bold bg-astrix-teal text-white px-3 py-1.5 rounded-md flex items-center gap-1"><Save className="w-3 h-3"/> Save</button>
                      </>
                    ) : (
                      <>
                        <button onClick={copyToClipboard} className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-md shadow-sm" title="Copy"><Copy className="w-3.5 h-3.5"/></button>
                        <button onClick={() => { setEditContent(activeArtifact.content); setIsEditing(true); }} className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-md shadow-sm" title="Edit"><Edit2 className="w-3.5 h-3.5"/></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6 font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white">
                  {isEditing ? (
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full min-h-[300px] outline-none resize-y bg-transparent" />
                  ) : (
                    activeArtifact.content
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No artifacts generated yet.</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-astrix-terra" /> Post-Launch Tracking
              </h3>
              {!hasLaunch && !showLaunchForm && (
                <button onClick={() => setShowLaunchForm(true)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">
                  Log Launch
                </button>
              )}
            </div>

            {showLaunchForm ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 animate-[fadeIn_0.3s_ease-out]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Launch Date</label>
                    <input type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-astrix-teal" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowLaunchForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                  <button onClick={handleLogLaunch} disabled={!launchDate || isSavingLaunch} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                    {isSavingLaunch ? 'Saving...' : 'Save Launch'}
                  </button>
                </div>
              </div>
            ) : hasLaunch ? (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span className="font-bold text-gray-900">Launched on:</span> {new Date(launch.launched_at).toLocaleDateString()}
                </div>
                {[7, 30, 60].map(days => {
                  const dueDate = new Date(launch.launched_at);
                  dueDate.setDate(dueDate.getDate() + days);
                  const isDue = new Date() >= dueDate;
                  
                  return (
                    <div key={days} className={`border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDue ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <div className={`font-bold mb-1 ${isDue ? 'text-amber-900' : 'text-gray-700'}`}>{days}-Day Measurement Window</div>
                        <div className={`text-xs font-medium flex items-center gap-1 ${isDue ? 'text-amber-700' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3"/> {isDue ? 'Due for review' : `Unlocks on ${dueDate.toLocaleDateString()}`}
                        </div>
                      </div>
                      <button disabled={!isDue} className={`px-4 py-2 rounded-lg text-sm font-bold ${isDue ? 'bg-white border border-amber-200 text-amber-700 shadow-sm hover:bg-amber-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        Enter Results
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Log a launch date to open tracking windows.</p>
            )}
          </div>

        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest text-center">Metadata</h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Author</span>
                <span className="font-bold text-gray-900">{currentDecision.users?.full_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Date</span>
                <span className="font-bold text-gray-900">{new Date(currentDecision.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};
