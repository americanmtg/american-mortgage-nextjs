'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../AdminContext';

interface Batch {
  id: number;
  name: string | null;
  programId: number;
  programName: string;
  status: string;
  totalRecords: number;
  qualifiedCount: number;
  failedCount: number;
  submittedBy: number;
  submittedByEmail: string;
  submittedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const statusBadge = (status: string, isDark: boolean) => {
  const base = 'rounded-full px-2.5 py-0.5 text-[11px] font-medium';
  return `${base} ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`;
};

export default function PrescreenBatches() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Rename state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Retry state
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    loadBatches();
  }, [page, statusFilter]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/prescreen/batches?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBatches(data.data.items || []);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRename = (batch: Batch) => {
    setEditingId(batch.id);
    setEditName(batch.name || `Batch #${batch.id}`);
  };

  const saveRename = async () => {
    if (!editingId || !editName.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch('/api/prescreen/batches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: editingId, name: editName.trim() }),
      });
      if (res.ok) {
        setBatches(prev => prev.map(b =>
          b.id === editingId ? { ...b, name: editName.trim() } : b
        ));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Rename failed:', err);
    } finally {
      setRenaming(false);
    }
  };

  const retryBatch = async (batchId: number) => {
    if (!confirm('Retry this failed batch? Records will be resubmitted to Altair.')) return;
    setRetryingId(batchId);
    try {
      const res = await fetch('/api/prescreen/batches/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Retry successful: ${data.data.qualifiedCount} qualified, ${data.data.failedCount} failed`);
        loadBatches();
      } else {
        alert(`Retry failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Retry failed: Network error');
    } finally {
      setRetryingId(null);
    }
  };

  const selectClass = `rounded-lg border px-3 py-2 pr-10 text-sm outline-none transition-all ${
    isDark
      ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500'
      : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;

  const thClass = `px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${
    isDark ? 'text-gray-500' : 'text-gray-400'
  }`;

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/prescreen"
            className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Batch History
            </h1>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {total} batches
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
          <Link
            href="/admin/prescreen/submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            New Batch
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`w-8 h-8 border-4 rounded-full animate-spin ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-200 border-t-gray-600'}`} />
          </div>
        ) : batches.length === 0 ? (
          <p className={`text-center py-12 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No batches found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                  <th className={thClass}>ID</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Program</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Records</th>
                  <th className={thClass}>Qualified</th>
                  <th className={thClass}>Failed</th>
                  <th className={thClass}>Submitted By</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    onClick={() => { if (editingId !== batch.id) router.push(`/admin/prescreen/results?batchId=${batch.id}`); }}
                    className={`transition-colors cursor-pointer ${
                      isDark
                        ? 'hover:bg-gray-700/20 border-b border-gray-700/30'
                        : 'hover:bg-gray-50/80 border-b border-gray-100/80'
                    }`}
                  >
                    <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      #{batch.id}
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {editingId === batch.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingId(null); }}
                            className={`px-2 py-1 text-sm rounded-lg border w-40 outline-none transition-all ${
                              isDark
                                ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
                            }`}
                            autoFocus
                          />
                          <button onClick={saveRename} disabled={renaming} className={`text-xs font-medium disabled:opacity-50 ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
                            {renaming ? '...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{batch.name || `Batch #${batch.id}`}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(batch); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                            title="Rename"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {batch.programName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={statusBadge(batch.status, isDark)}>
                        {batch.status}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {batch.totalRecords}
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-medium tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {batch.qualifiedCount}
                    </td>
                    <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {batch.failedCount}
                    </td>
                    <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {batch.submittedByEmail}
                    </td>
                    <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {batch.status === 'failed' && batch.errorMessage && (
                        <button
                          onClick={(e) => { e.stopPropagation(); retryBatch(batch.id); }}
                          disabled={retryingId === batch.id}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                            isDark
                              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}
                        >
                          {retryingId === batch.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
