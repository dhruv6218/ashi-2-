import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Building2, Loader2, CheckCircle2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { processAccountsCsv, processSignalsCsv } from '../../lib/csvParser';
import { useToast } from '../../contexts/ToastContext';
import { triggerUpdate } from '../../lib/api';
import { posthog } from '../../lib/instrument';
import FocusLock from 'react-focus-lock';

export const CsvUploadModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'accounts'>('signals');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ type: string, count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setResult(null);
      setError(null);
    };
    const handleClose = () => setIsOpen(false);
    
    window.addEventListener('open-upload-modal', handleOpen);
    window.addEventListener('close-modals', handleClose);
    
    return () => {
      window.removeEventListener('open-upload-modal', handleOpen);
      window.removeEventListener('close-modals', handleClose);
    };
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;

    setIsUploading(true);
    setResult(null);
    setError(null);

    try {
      let count = 0;
      if (activeTab === 'accounts') {
        count = await processAccountsCsv(file, activeWorkspace.id);
        triggerUpdate();
      } else {
        count = await processSignalsCsv(file, activeWorkspace.id);
        triggerUpdate();
      }
      
      posthog.capture('csv_uploaded', { workspace_id: activeWorkspace.id, type: activeTab, rows_imported: count });
      
      setResult({ type: activeTab, count });
      addToast(`Successfully imported ${count} ${activeTab}`, 'success');
    } catch (err: any) {
      console.error("Upload Error:", err);
      setError(err.message || 'Failed to process CSV. Please check the required headers.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <FocusLock>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isUploading && setIsOpen(false)}></div>
        
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 id="modal-title" className="font-heading text-xl font-bold text-gray-900">Import Data</h2>
            <button onClick={() => !isUploading && setIsOpen(false)} className="text-gray-400 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-md" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6" role="tablist">
              <button 
                role="tab"
                aria-selected={activeTab === 'signals'}
                onClick={() => {setActiveTab('signals'); setResult(null); setError(null);}}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'signals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <UploadCloud className="w-4 h-4" /> Signals
              </button>
              <button 
                role="tab"
                aria-selected={activeTab === 'accounts'}
                onClick={() => {setActiveTab('accounts'); setResult(null); setError(null);}}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'accounts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Building2 className="w-4 h-4" /> Accounts
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium" role="alert">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              <div className="text-center py-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Import Successful!</h3>
                <p className="text-gray-500 font-medium mb-6">Added {result.count} {result.type} to your workspace.</p>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-brand-blue mx-auto mb-4 opacity-80" />
                <h3 className="font-bold text-gray-900 mb-2">
                  Upload {activeTab === 'signals' ? 'Signals' : 'Accounts'} CSV
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {activeTab === 'signals' 
                    ? 'Required column: signal_text. Optional: account_name, source, severity.' 
                    : 'Required columns: account_name, arr. Optional: domain, plan.'}
                </p>
                
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  aria-label={`Upload ${activeTab} CSV file`}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Select CSV File'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FocusLock>
  );
};
