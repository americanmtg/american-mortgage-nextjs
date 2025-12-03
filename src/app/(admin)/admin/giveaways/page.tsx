'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Giveaway {
  id: number;
  title: string;
  slug: string;
  prizeTitle: string;
  prizeValue: number | null;
  startDate: string;
  endDate: string;
  status: string;
  winnerSelected: boolean;
  entryCount?: number;
  winnerCount?: number;
  archived?: boolean;
  deletedAt?: string | null;
  position?: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  ended: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  ended: 'Ended',
  cancelled: 'Cancelled',
};

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [archivedGiveaways, setArchivedGiveaways] = useState<Giveaway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    fetchGiveaways();
  }, [filterStatus]);

  async function fetchGiveaways() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('includeStats', 'true');
      if (filterStatus) {
        params.set('status', filterStatus);
      }

      // Fetch active giveaways
      const res = await fetch(`/api/giveaways?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch giveaways');
      }

      const result = await res.json();
      setGiveaways(result.data?.items || []);

      // Fetch archived giveaways
      const archivedParams = new URLSearchParams();
      archivedParams.set('includeStats', 'true');
      archivedParams.set('archived', 'true');

      const archivedRes = await fetch(`/api/giveaways?${archivedParams}`, {
        credentials: 'include',
      });

      if (archivedRes.ok) {
        const archivedResult = await archivedRes.json();
        setArchivedGiveaways(archivedResult.data?.items || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Are you sure you want to archive "${title}"? It will be moved to the archived section.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/giveaways/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to archive giveaway');
      }

      // Refresh list
      fetchGiveaways();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRestore(id: number) {
    try {
      const res = await fetch(`/api/giveaways/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ archived: false, deletedAt: null }),
      });

      if (!res.ok) {
        throw new Error('Failed to restore giveaway');
      }

      // Refresh list
      fetchGiveaways();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatCurrency(value: number | null) {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getGiveawayStatus(giveaway: Giveaway): string {
    if (giveaway.status === 'cancelled') return 'cancelled';
    if (giveaway.status === 'draft') return 'draft';

    const now = new Date();
    const startDate = new Date(giveaway.startDate);
    const endDate = new Date(giveaway.endDate);

    if (now < startDate) return 'draft';
    if (now > endDate) return 'ended';
    return 'active';
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the array
    const newGiveaways = [...giveaways];
    const [draggedItem] = newGiveaways.splice(draggedIndex, 1);
    newGiveaways.splice(dropIndex, 0, draggedItem);
    setGiveaways(newGiveaways);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Save the new order to the server
    await saveOrder(newGiveaways.map(g => g.id));
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  async function saveOrder(order: number[]) {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/giveaways/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ order }),
      });

      if (!res.ok) {
        throw new Error('Failed to save order');
      }
    } catch (err: any) {
      alert('Failed to save order: ' + err.message);
      // Refresh to get the original order back
      fetchGiveaways();
    } finally {
      setIsSavingOrder(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giveaways</h1>
          <p className="text-gray-600 mt-1">Manage promotional giveaways and sweepstakes</p>
        </div>
        <Link
          href="/admin/giveaways/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Giveaway
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Giveaways</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading giveaways...</p>
        </div>
      )}

      {/* Giveaways List */}
      {!isLoading && giveaways.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No giveaways yet</h3>
          <p className="text-gray-500 mb-6">Create your first giveaway to start collecting entries</p>
          <Link
            href="/admin/giveaways/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Giveaway
          </Link>
        </div>
      )}

      {!isLoading && giveaways.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-2 py-3">
                  {isSavingOrder && (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  )}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giveaway
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prize
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entries
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {giveaways.map((giveaway, index) => {
                const displayStatus = getGiveawayStatus(giveaway);
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                return (
                  <tr
                    key={giveaway.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50 transition-colors ${isDragging ? 'opacity-50 bg-blue-50' : ''} ${isDragOver ? 'border-t-2 border-blue-500' : ''}`}
                  >
                    <td className="px-2 py-4">
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/admin/giveaways/${giveaway.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {giveaway.title}
                        </Link>
                        <p className="text-sm text-gray-500">/{giveaway.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900">{giveaway.prizeTitle}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(giveaway.prizeValue)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{formatDate(giveaway.startDate)}</p>
                        <p className="text-gray-500">to {formatDate(giveaway.endDate)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div>
                        <span className="text-lg font-semibold text-gray-900">
                          {giveaway.entryCount || 0}
                        </span>
                        {giveaway.winnerSelected && giveaway.winnerCount && giveaway.winnerCount > 0 && (
                          <p className="text-xs text-green-600">
                            {giveaway.winnerCount} winner{giveaway.winnerCount > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[displayStatus]}`}>
                        {statusLabels[displayStatus]}
                      </span>
                      {giveaway.winnerSelected && (
                        <p className="text-xs text-green-600 mt-1">Winners Selected</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/giveaways/${giveaway.id}/entries`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Entries"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/giveaways/${giveaway.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(giveaway.id, giveaway.title)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Archived Giveaways Section */}
      {!isLoading && archivedGiveaways.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className={`w-5 h-5 transition-transform ${showArchived ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium">Archived Giveaways ({archivedGiveaways.length})</span>
          </button>

          {showArchived && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giveaway
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prize
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archived
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entries
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {archivedGiveaways.map((giveaway) => (
                    <tr key={giveaway.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium text-gray-700">{giveaway.title}</span>
                          <p className="text-sm text-gray-500">/{giveaway.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-700">{giveaway.prizeTitle}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(giveaway.prizeValue)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {giveaway.deletedAt ? formatDate(giveaway.deletedAt) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-600">{giveaway.entryCount || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRestore(giveaway.id)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
