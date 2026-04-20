import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { useArtifact, api } from '../../lib/api';
import { FileText, ArrowLeft, Copy, Edit2, Check, Clock, User, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '../../contexts/ToastContext';

export const ArtifactDetail = () => {
  const { id } = useParams();
  const { data: artifact, isLoading } = useArtifact(id);
  const { addToast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  if (isLoading) {
    return (
      <AppLayout title="Loading Artifact...">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-astrix-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (!artifact) {
    return (
      <AppLayout title="Artifact Not Found">
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Artifact Not Found</h2>
          <Link to="/app/artifacts" className="text-brand-blue font-bold flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setIsCopying(true);
    addToast('Markdown copied to clipboard', 'success');
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleSave = async () => {
    if (!id) return;
    await api.artifacts.update(id, { content: editContent });
    setIsEditing(false);
    addToast('Artifact updated', 'success');
  };

  return (
    <AppLayout 
      title={artifact.title} 
      subtitle={`${artifact.type} • Last updated ${new Date(artifact.updated_at).toLocaleDateString()}`}
      backPath="/app/artifacts"
      actions={
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button onClick={handleCopy} className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                {isCopying ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                Copy Markdown
              </button>
              <button 
                onClick={() => { setEditContent(artifact.content); setIsEditing(true); }} 
                className="text-sm font-bold text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-black flex items-center gap-2 shadow-sm"
              >
                <Edit2 className="w-4 h-4" /> Edit Content
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2">Cancel</button>
              <button onClick={handleSave} className="text-sm font-bold text-white bg-astrix-teal px-4 py-2 rounded-lg hover:bg-teal-700 shadow-sm">Save Changes</button>
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px]">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[600px] p-8 font-mono text-sm border-none outline-none resize-none bg-gray-50/50"
                spellCheck={false}
              />
            ) : (
              <div className="p-8 md:p-12 prose prose-stone max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">Metadata</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Created {new Date(artifact.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Author: {artifact.users?.full_name || 'Demo User'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Share2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Public: No (Internal only)</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h4 className="font-bold text-blue-900 mb-2">Context</h4>
            <p className="text-sm text-blue-800/80 leading-relaxed font-medium">
              This artifact was generated from a decision recorded on {new Date(artifact.created_at).toLocaleDateString()}. It contains the evidence-backed requirements for the proposed feature.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};
