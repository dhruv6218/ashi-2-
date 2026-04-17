import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import {
  FileText, Copy, Edit2, Save, ChevronDown,
  Clock, Plus, FileCode2, FilePen, Send, Loader2
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useArtifacts, api } from '../../lib/api';
import { Artifact } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { AIBadge } from '../../components/ui/AIBadge';
import { Skeleton } from '../../components/ui/Skeleton';

export const ArtifactStudio = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: artifacts, isLoading } = useArtifacts(activeWorkspace?.id);
  const { addToast } = useToast();

  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions] = useState([{ id: 'v1', number: 1, date: 'Today', label: 'Current' }]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  
  // Streaming AI State
  const [isTyping, setIsTyping] = useState(false);
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (artifacts.length > 0 && !selectedArtifact && !isGenerating && !isTyping) {
      setSelectedArtifact(artifacts[0]);
      setDisplayedContent(artifacts[0].content);
    }
  }, [artifacts, selectedArtifact, isGenerating, isTyping]);

  // Typewriter effect for AI generation
  useEffect(() => {
    if (isTyping && selectedArtifact) {
      let i = 0;
      const fullText = selectedArtifact.content;
      const interval = setInterval(() => {
        setDisplayedContent(fullText.slice(0, i));
        i += 3; // speed of typing
        if (i > fullText.length) {
          clearInterval(interval);
          setIsTyping(false);
          setDisplayedContent(fullText);
        }
      }, 10);
      return () => clearInterval(interval);
    } else if (selectedArtifact && !isTyping) {
      setDisplayedContent(selectedArtifact.content);
    }
  }, [isTyping, selectedArtifact]);

  const handleCopy = () => {
    if (selectedArtifact) {
      navigator.clipboard.writeText(selectedArtifact.content);
      addToast('Copied to clipboard', 'success');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedArtifact) return;
    await api.artifacts.update(selectedArtifact.id, { content: editContent });
    setSelectedArtifact({ ...selectedArtifact, content: editContent });
    setIsEditing(false);
    addToast('Changes saved as new version', 'success');
  };

  const handleGenerateMock = async () => {
    setIsGenerating(true);
    
    // Simulate realistic LLM generation latency
    setLoadingStage('Analyzing evidence and decisions...');
    await new Promise(r => setTimeout(r, 2000));
    setLoadingStage('Drafting document structure...');
    await new Promise(r => setTimeout(r, 2000));
    setLoadingStage('Finalizing markdown output...');
    await new Promise(r => setTimeout(r, 2000));

    const newArt = await api.artifacts.create({
      workspace_id: activeWorkspace?.id,
      decision_id: 'mock-dec',
      title: 'New Feature PRD',
      type: 'prd',
      content: '# New Feature PRD\n\n## 1. Problem Statement\nEnterprise accounts are churning due to lack of SAML SSO. IT departments are mandating Okta/Azure AD compliance.\n\n## 2. Scope\n- Implement SAML 2.0 protocol\n- Support Okta and Azure AD identity providers\n- Just-in-Time (JIT) user provisioning\n\n## 3. Success Metrics\n- 0 churns citing security compliance next quarter.\n- 100% of Enterprise tier accounts migrated to SSO within 60 days of launch.',
      author_id: 'user-1'
    });
    
    setSelectedArtifact(newArt);
    setIsGenerating(false);
    setLoadingStage('');
    setIsTyping(true);
    setDisplayedContent('');
    addToast('Artifact generated successfully', 'success');
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <AppLayout
      title="Artifact Studio"
      subtitle="AI-generated execution-ready documents"
      actions={
        <button onClick={handleGenerateMock} disabled={isGenerating || isTyping} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> {isGenerating ? 'Generating...' : 'Generate New'}
        </button>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full">

        {/* LEFT: Artifact List */}
        <div className="w-full lg:w-72 shrink-0 space-y-3 max-h-[40vh] lg:max-h-none overflow-y-auto hide-scrollbar">
          <div className="text-xs font-mono text-gray-400 uppercase font-bold px-1 mb-2">Your Artifacts ({artifacts.length})</div>
          {isLoading && artifacts.length === 0 ? (
            <div className="space-y-3"><Skeleton className="w-full h-20" /><Skeleton className="w-full h-20" /></div>
          ) : (
            artifacts.map(art => (
              <button
                key={art.id}
                onClick={() => { setSelectedArtifact(art); setIsEditing(false); setIsTyping(false); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedArtifact?.id === art.id ? 'border-astrix-teal bg-teal-50/30 shadow-sm' : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${art.type === 'prd' ? 'bg-blue-50 text-brand-blue' : 'bg-purple-50 text-purple-700'}`}>
                    {art.type === 'prd' ? <FileCode2 className="w-4 h-4" /> : <FilePen className="w-4 h-4" />}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm text-gray-900 leading-tight truncate">{art.title}</div>
                    <div className="text-xs font-mono text-gray-500 mt-1">{formatDate(art.created_at)}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-gray-400">{art.type === 'prd' ? 'PRD' : 'Decision Memo'}</div>
                  </div>
                </div>
              </button>
            ))
          )}

          {artifacts.length === 0 && !isLoading && (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900 mb-1">No artifacts yet</p>
              <p className="text-xs text-gray-500">Generate from a decision to get started.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Artifact Viewer/Editor */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-astrix-teal" />
              <p className="text-sm font-mono text-gray-500 animate-pulse">{loadingStage}</p>
            </div>
          ) : selectedArtifact ? (
            <>
              {/* Toolbar */}
              <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <AIBadge />
                  <div className="relative">
                    <button onClick={() => setShowVersions(!showVersions)} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
                      Version 1 (Current) <ChevronDown className="w-3 h-3" />
                    </button>
                    {showVersions && (
                      <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 animate-[fadeIn_0.15s_ease-out]">
                        {versions.map(v => (
                          <button key={v.id} onClick={() => setShowVersions(false)} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 text-gray-700 flex justify-between items-center">
                            <span>Version {v.number} {v.label && <span className="text-gray-400 font-normal">({v.label})</span>}</span>
                            <span className="text-gray-400 font-normal text-[10px]">{v.date}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedArtifact.updated_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2 py-1.5">Cancel</button>
                      <button onClick={handleSaveEdit} className="text-xs font-bold bg-astrix-teal text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-astrix-darkTeal">
                        <Save className="w-3 h-3" /> Save Version
                      </button>
                    </>
                  ) : (
                    <>
                    <button onClick={handleCopy} disabled={isTyping} title="Copy markdown" className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setEditContent(selectedArtifact.content); setIsEditing(true); }} disabled={isTyping} className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-gray-50 disabled:opacity-50">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </>
                  )}
                </div>
              </div>

              {/* Artifact Header */}
              <div className="p-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedArtifact.type === 'prd' ? 'bg-blue-50 text-brand-blue' : 'bg-purple-50 text-purple-700'}`}>
                    {selectedArtifact.type === 'prd' ? 'Product Requirements Document' : 'Decision Memo'}
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold text-gray-900">{selectedArtifact.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-500">
                  <span>By {selectedArtifact.users?.full_name || 'System'}</span>
                  <span>•</span>
                  <span>Linked: {selectedArtifact.decisions?.title || 'Decision'}</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[500px] outline-none resize-none font-mono text-sm text-gray-800 bg-transparent leading-relaxed"
                  />
                ) : (
                  <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {displayedContent}
                    {isTyping && <span className="inline-block w-2 h-4 bg-astrix-teal animate-pulse ml-1 align-middle"></span>}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-12">
              <div>
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">Select an artifact</h3>
                <p className="text-sm text-gray-500">Choose from the list on the left to view or edit.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
