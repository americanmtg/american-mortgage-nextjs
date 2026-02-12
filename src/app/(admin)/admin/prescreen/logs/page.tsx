'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '../../../AdminContext';

interface AuditLog {
  id: number;
  leadId: number | null;
  leadName: string | null;
  batchId: number | null;
  action: string;
  performedBy: number | null;
  performedByEmail: string | null;
  ipAddress: string | null;
  details: any;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTIONS = [
  'lead_viewed',
  'lead_decrypted',
  'lead_exported',
  'lead_note_updated',
  'lead_firm_offer_updated',
  'hard_pull_added',
  'hard_pull_deleted',
  'batch_submitted',
  'batch_completed',
  'program_created',
  'program_updated',
];

const actionBadge = (action: string, isDark: boolean) => {
  return isDark
    ? 'bg-gray-700/60 text-gray-300'
    : 'bg-gray-100 text-gray-600';
};

const actionLabel = (action: string) =>
  action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function PrescreenLogsPage() {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/prescreen/audit-log?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data.items || []);
        setPagination(data.data.pagination || null);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter]);

  // Client-side name filter (API returns leadName)
  const filtered = searchName
    ? logs.filter((l) => l.leadName?.toLowerCase().includes(searchName.toLowerCase()))
    : logs;

  const inputClass = `rounded-lg border px-3 py-2 pr-10 text-sm outline-none transition-all ${
    isDark
      ? 'bg-gray-800/80 border-gray-700/60 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-600'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;

  const labelClass = `block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-gray-500' : 'text-gray-400'
  }`;

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/prescreen"
            className={`p-2 rounded-md transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1
              className={`text-2xl font-semibold tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Activity Log
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              All prescreen actions, decryptions, and changes
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`rounded-lg border p-4 mb-6 flex flex-wrap items-end gap-4 ${
          isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'
        }`}
      >
        <div>
          <label className={labelClass}>Action Type</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Search Lead Name</label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="e.g. John Smith"
            className={`${inputClass} w-48`}
          />
        </div>
        {pagination && (
          <p className={`text-sm ml-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {pagination.total} total entries
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div
            className={`w-8 h-8 border-4 rounded-full animate-spin ${
              isDark ? 'border-gray-700 border-t-gray-400' : 'border-gray-200 border-t-gray-600'
            }`}
          />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div
          className={`rounded-lg border overflow-hidden ${
            isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={
                    isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'
                  }
                >
                  <th
                    className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Date/Time
                  </th>
                  <th
                    className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Action
                  </th>
                  <th
                    className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Lead
                  </th>
                  <th
                    className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    User
                  </th>
                  <th
                    className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    {/* Expand */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-5 py-8 text-center text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      No log entries found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className={`cursor-pointer transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700/20 border-b border-gray-700/60'
                            : 'hover:bg-gray-50/80 border-b border-gray-100/80'
                        }`}
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <td
                          className={`px-5 py-3.5 text-sm whitespace-nowrap ${
                            isDark ? 'text-gray-300' : 'text-gray-900'
                          }`}
                        >
                          {new Date(log.createdAt).toLocaleDateString()}{' '}
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${actionBadge(
                              log.action,
                              isDark
                            )}`}
                          >
                            {actionLabel(log.action)}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3.5 text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-900'
                          }`}
                        >
                          {log.leadId ? (
                            <Link
                              href={`/admin/prescreen/results/${log.leadId}`}
                              className={`hover:underline ${
                                isDark
                                  ? 'text-gray-300 hover:text-gray-100'
                                  : 'text-gray-700 hover:text-gray-900'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {log.leadName || `Lead #${log.leadId}`}
                            </Link>
                          ) : (
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              —
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-5 py-3.5 text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-900'
                          }`}
                        >
                          {log.performedByEmail || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-center">
                          <span
                            className={`inline-block transition-transform duration-200 ${
                              expandedId === log.id ? 'rotate-90' : ''
                            } ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                          >
                            &#9654;
                          </span>
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr
                          key={`${log.id}-detail`}
                          className={
                            isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'
                          }
                        >
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p
                                  className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${
                                    isDark ? 'text-gray-500' : 'text-gray-400'
                                  }`}
                                >
                                  IP Address
                                </p>
                                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                  {log.ipAddress || '—'}
                                </p>
                              </div>
                              {log.batchId && (
                                <div>
                                  <p
                                    className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${
                                      isDark ? 'text-gray-500' : 'text-gray-400'
                                    }`}
                                  >
                                    Batch ID
                                  </p>
                                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                    {log.batchId}
                                  </p>
                                </div>
                              )}
                              {log.details && (
                                <div className="md:col-span-2">
                                  <p
                                    className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${
                                      isDark ? 'text-gray-500' : 'text-gray-400'
                                    }`}
                                  >
                                    Details
                                  </p>
                                  <pre
                                    className={`text-xs p-3 rounded-lg overflow-auto max-h-48 ${
                                      isDark
                                        ? 'bg-gray-900 text-gray-300'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {typeof log.details === 'string'
                                      ? log.details
                                      : JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div
              className={`flex items-center justify-between px-5 py-3.5 border-t ${
                isDark ? 'border-gray-700/60' : 'border-gray-100'
              }`}
            >
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
