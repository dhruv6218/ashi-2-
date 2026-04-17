import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Building2, Plus, UploadCloud, X, Loader2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAccounts, api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  SortingState,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';

export const AccountsList = () => {
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accArr, setAccArr] = useState('');
  const [accPlan, setAccPlan] = useState('Standard');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  const { data, isLoading } = useAccounts(activeWorkspace?.id, {
    page: pageIndex + 1,
    limit: pageSize,
    sorting
  });

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !accName) return;
    setIsSavingAccount(true);
    
    try {
      await api.accounts.create({
        workspace_id: activeWorkspace.id,
        name: accName,
        arr: parseFloat(accArr) || 0,
        plan: accPlan
      });
      addToast(`Account added successfully`, "success");
      setIsAccountModalOpen(false);
      setAccName('');
      setAccArr('');
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const columnHelper = createColumnHelper<any>();
  const accountColumns = useMemo(() => [
    columnHelper.accessor('name', { 
      header: 'Account Name', 
      cell: info => <span className="font-bold text-gray-900">{info.getValue()}</span> 
    }),
    columnHelper.accessor('arr', { 
      header: 'ARR', 
      cell: info => <span className="font-mono font-bold text-astrix-teal">{formatCurrency(info.getValue() || 0)}</span> 
    }),
    columnHelper.accessor('plan', { 
      header: 'Plan', 
      cell: info => <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{info.getValue() || 'Standard'}</span> 
    }),
    columnHelper.accessor('signal_count', { 
      header: 'Signals', 
      cell: info => <span className="font-bold text-gray-700">{info.getValue() || 0}</span> 
    }),
  ], []);

  const accountTable = useReactTable({
    data: data.rows, 
    columns: accountColumns, 
    pageCount: Math.ceil(data.total / pageSize),
    state: { sorting, pagination },
    onSortingChange: setSorting, 
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), 
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <AppLayout 
      title="Accounts" 
      subtitle="CRM context layer for opportunity scoring."
      actions={
        <div className="flex gap-2">
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))} className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setIsAccountModalOpen(true)} className="text-sm font-bold text-white bg-astrix-teal px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4"/> Add Account
          </button>
        </div>
      }
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-astrix-teal" /></div>
        ) : data.rows.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <Building2 className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No accounts found</h3>
            <p className="text-sm mb-4">Upload a CSV or add an account manually to inject ARR context.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 font-mono text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  {accountTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accountTable.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {accountTable.getRowModel().rows.map(row => {
                const acc = row.original;
                return (
                  <div key={row.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900">{acc.name}</span>
                      <span className="font-mono font-bold text-astrix-teal">{formatCurrency(acc.arr)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{acc.plan || 'Standard'}</span>
                      <span className="text-gray-500 font-bold">{acc.signal_count || 0} Signals</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 mt-auto">
              <span className="text-sm text-gray-500 font-medium">
                Showing {accountTable.getRowModel().rows.length} of {data.total} accounts
              </span>
              <div className="flex gap-2">
                <button onClick={() => accountTable.previousPage()} disabled={!accountTable.getCanPreviousPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50">Prev</button>
                <button onClick={() => accountTable.nextPage()} disabled={!accountTable.getCanNextPage()} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Account Add Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSavingAccount && setIsAccountModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-heading text-xl font-bold text-gray-900">Add Account</h2>
              <button onClick={() => !isSavingAccount && setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Account Name *</label>
                <input type="text" required value={accName} onChange={e => setAccName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">ARR ($) *</label>
                  <input type="number" required min="0" value={accArr} onChange={e => setAccArr(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Plan Tier</label>
                  <select value={accPlan} onChange={e => setAccPlan(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-astrix-teal">
                    <option>Standard</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={isSavingAccount || !accName} className="bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isSavingAccount && <Loader2 className="w-4 h-4 animate-spin"/>} Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
