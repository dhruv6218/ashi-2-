import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Search, Hash, MessageCircle, Github, AlertCircle, X, FileSpreadsheet, Database, UploadCloud, Plus, Loader2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { useSignals, useAccounts, api, triggerUpdate } from '../../lib/api';
import { Signal } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { AIBadge } from '../../components/ui/AIBadge';
import { useToast } from '../../contexts/ToastContext';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  SortingState,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';

export const SignalExplorer = ({ defaultOpenAdd = false }: { defaultOpenAdd?: boolean }) => {
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Advanced Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  // Fetch Server State
  const { data, isLoading } = useSignals(activeWorkspace?.id, {
    page: pageIndex + 1,
    limit: pageSize,
    globalFilter,
    severityFilter,
    sentimentFilter,
    sourceFilter,
    sorting
  });
  
  const { data: accountsData } = useAccounts(activeWorkspace?.id);
  const accounts = accountsData?.rows || [];

  const activeSignal = data.rows.find(s => s.id === selectedSignalId);

  // Manual Signal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingSignal, setIsSavingSignal] = useState(false);
  const [newSignal, setNewSignal] = useState({
    raw_text: '',
    source_type: 'Manual',
    severity_label: 'Medium',
    sentiment_label: 'Neutral',
    account_id: ''
  });

  React.useEffect(() => {
    if (defaultOpenAdd) {
      setIsAddModalOpen(true);
    }
  }, [defaultOpenAdd]);

  const handleSaveSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !newSignal.raw_text) return;
    
    setIsSavingSignal(true);
    try {
      const selectedAccount = accounts.find(a => a.id === newSignal.account_id);
      await api.signals.create({
        workspace_id: activeWorkspace.id,
        ...newSignal,
        accounts: selectedAccount ? { name: selectedAccount.name, arr: selectedAccount.arr, plan: selectedAccount.plan || 'Standard' } : undefined
      });
      addToast("Signal added successfully", "success");
      setIsAddModalOpen(false);
      setNewSignal({ raw_text: '', source_type: 'Manual', severity_label: 'Medium', sentiment_label: 'Neutral', account_id: '' });
    } catch (err: any) {
      addToast("Failed to add signal", "error");
    } finally {
      setIsSavingSignal(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch(source?.toLowerCase()) {
      case 'slack': return <Hash className="w-5 h-5 text-pink-600" />;
      case 'discord': return <MessageCircle className="w-5 h-5 text-indigo-500" />;
      case 'github': return <Github className="w-5 h-5 text-gray-900" />;
      default: return <FileSpreadsheet className="w-5 h-5 text-gray-700" />;
    }
  };

  const columnHelper = createColumnHelper<Signal>();

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="accent-astrix-teal cursor-pointer w-4 h-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="accent-astrix-teal cursor-pointer w-4 h-4"
        />
      ),
    }),
    columnHelper.accessor('source_type', {
      header: 'Source',
      cell: info => <div className="flex justify-center">{getSourceIcon(info.getValue())}</div>,
    }),
    columnHelper.accessor('raw_text', {
      header: 'Preview Text',
      cell: info => <div className="truncate max-w-[200px] md:max-w-[300px] text-gray-900 font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor('severity_label', {
      header: 'Severity',
      cell: info => {
        const val = info.getValue();
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${val === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            {val === 'Critical' && <AlertCircle className="w-3 h-3" />} {val || 'Unrated'}
          </span>
        );
      }
    }),
    columnHelper.accessor('product_area', {
      header: 'Area',
      cell: info => <span className="text-gray-600 font-medium">{info.getValue() || 'Unknown'}</span>,
    }),
    columnHelper.accessor(row => row.accounts?.name, {
      id: 'account',
      header: 'Account',
      cell: info => <span className="text-gray-900 font-bold">{info.getValue() || 'Unknown'}</span>,
    }),
  ], []);

  const table = useReactTable({
    data: data.rows,
    columns,
    pageCount: Math.ceil(data.total / pageSize),
    state: { sorting, globalFilter, rowSelection, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const handleBulkAction = (action: string) => {
    addToast(`${Object.keys(rowSelection).length} signals marked as ${action}`, "success");
    setRowSelection({});
  };

  return (
    <AppLayout 
      title="Signal Explorer" 
      subtitle={`${data.total} total signals ingested`}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Import CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Signal
          </button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-astrix-teal transition-all flex-1">
          <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
          <input 
            type="text" 
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all signals by keyword, account, or category..." 
            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 py-1"
          />
        </div>
        <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
          <select 
            value={severityFilter} 
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-white border border-gray-200 text-xs font-bold text-gray-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal shadow-sm min-w-[120px]"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            value={sentimentFilter} 
            onChange={e => setSentimentFilter(e.target.value)}
            className="bg-white border border-gray-200 text-xs font-bold text-gray-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal shadow-sm min-w-[120px]"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          <select 
            value={sourceFilter} 
            onChange={e => setSourceFilter(e.target.value)}
            className="bg-white border border-gray-200 text-xs font-bold text-gray-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-astrix-teal shadow-sm min-w-[120px]"
          >
            <option value="">All Sources</option>
            <option value="Manual">Manual</option>
            <option value="CSV Import">CSV Import</option>
            <option value="Support Ticket">Support Ticket</option>
            <option value="Email">Email</option>
          </select>
          {(severityFilter || sentimentFilter || sourceFilter) && (
            <button 
              onClick={() => { setSeverityFilter(''); setSentimentFilter(''); setSourceFilter(''); }}
              className="text-xs font-bold text-red-500 underline underline-offset-4 px-2 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-astrix-teal/10 border border-astrix-teal/20 rounded-xl p-3 mb-6 flex items-center justify-between animate-[fadeIn_0.2s_ease-out]">
          <span className="text-sm font-bold text-astrix-teal">{Object.keys(rowSelection).length} selected</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('Noise')} className="text-xs font-bold bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50">Mark as Noise</button>
            <button onClick={() => handleBulkAction('Linked')} className="text-xs font-bold bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50">Link to Problem</button>
          </div>
        </div>
      )}

      <div className="flex gap-6 relative min-h-[400px]">
        
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 transition-all duration-300 ${selectedSignalId ? 'md:mr-[420px]' : ''}`}>
          
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : data.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No signals found</h3>
              <p className="font-medium text-sm mb-4">Try adjusting your search or upload a CSV to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200 font-mono text-xs text-gray-500 uppercase tracking-wider">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className="p-4 font-semibold cursor-pointer hover:bg-gray-100 transition-colors" onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {table.getRowModel().rows.map(row => (
                      <tr 
                        key={row.id} 
                        onClick={() => navigate(`/app/signals/${row.original.id}`)}
                        className={`cursor-pointer transition-colors hover:bg-gray-50`}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="p-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden flex flex-col p-4 gap-3">
                {table.getRowModel().rows.map(row => {
                  const sig = row.original;
                  return (
                    <div 
                      key={row.id} 
                      onClick={() => navigate(`/app/signals/${sig.id}`)} 
                      className={`border p-4 rounded-xl shadow-sm flex flex-col gap-3 cursor-pointer transition-colors bg-white border-gray-200 hover:bg-gray-50`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(sig.source_type)}
                          <span className="font-bold text-sm text-gray-900">{sig.source_type}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sig.severity_label === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {sig.severity_label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3 font-medium">"{sig.raw_text}"</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 font-mono mt-1">
                        <span className="font-bold text-gray-900">{sig.accounts?.name || 'Unknown Account'}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{sig.product_area || 'Unknown'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Server-Side Pagination Controls */}
              <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                <span className="text-sm text-gray-500 font-medium">
                  Showing {table.getRowModel().rows.length} of {data.total} signals
                </span>
                <div className="flex gap-2">
                  <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50">Prev</button>
                  <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer */}
        <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-full sm:w-[400px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 overflow-y-auto ${selectedSignalId ? 'translate-x-0' : 'translate-x-full'}`}>
          {activeSignal && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-lg font-bold text-gray-900">Signal Details</h3>
                <button onClick={() => setSelectedSignalId(null)} className="p-2 text-gray-400 hover:text-gray-900 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <div className="text-xs font-mono font-bold text-gray-500 uppercase mb-2">Raw Text</div>
                <p className="text-gray-900 text-sm leading-relaxed font-medium">"{activeSignal.raw_text}"</p>
              </div>

              <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-mono font-bold text-gray-500 uppercase">Normalized Text</div>
                  <AIBadge />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed font-medium italic">
                  {activeSignal.normalized_text || "User is requesting SAML SSO integration to comply with internal security policies."}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Override Classification</h4>
                    <AIBadge />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Severity</label>
                      <select className="w-full text-sm border border-gray-200 rounded p-2 focus:ring-2 focus:ring-astrix-teal outline-none" defaultValue={activeSignal.severity_label || ''}>
                        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Sentiment</label>
                      <select className="w-full text-sm border border-gray-200 rounded p-2 focus:ring-2 focus:ring-astrix-teal outline-none" defaultValue={activeSignal.sentiment_label || ''}>
                        <option>Negative</option><option>Neutral</option><option>Positive</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Product Area</label>
                      <select className="w-full text-sm border border-gray-200 rounded p-2 focus:ring-2 focus:ring-astrix-teal outline-none" defaultValue={activeSignal.product_area || ''}>
                        <option>Authentication</option><option>Core UI</option><option>Billing</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Manual Add Signal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSavingSignal && setIsAddModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Add Signal Manually</h2>
              <button onClick={() => !isSavingSignal && setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveSignal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Raw Feedback / Signal Text *</label>
                <textarea 
                  required 
                  value={newSignal.raw_text} 
                  onChange={e => setNewSignal({...newSignal, raw_text: e.target.value})} 
                  placeholder="Paste the customer feedback here..."
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal min-h-[100px] resize-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Source</label>
                  <select value={newSignal.source_type} onChange={e => setNewSignal({...newSignal, source_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option>Manual</option>
                    <option>CSV Import</option>
                    <option>Support Ticket</option>
                    <option>Interview Note</option>
                    <option>App Review</option>
                    <option>Email</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Linked Account</label>
                  <select value={newSignal.account_id} onChange={e => setNewSignal({...newSignal, account_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option value="">-- No Account --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Severity</label>
                  <select value={newSignal.severity_label} onChange={e => setNewSignal({...newSignal, severity_label: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Sentiment</label>
                  <select value={newSignal.sentiment_label} onChange={e => setNewSignal({...newSignal, sentiment_label: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option>Negative</option>
                    <option>Neutral</option>
                    <option>Positive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isSavingSignal || !newSignal.raw_text} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isSavingSignal && <Loader2 className="w-4 h-4 animate-spin"/>} Save Signal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
