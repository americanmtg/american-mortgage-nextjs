'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Winner {
  id: number;
  giveawayId: number;
  entryId: number;
  winnerType: 'primary' | 'alternate';
  alternateOrder: number | null;
  status: string;
  notifiedAt: string | null;
  notificationMethod: string | null;
  claimDeadline: string | null;
  claimedAt: string | null;
  createdAt: string;
  entry: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    state: string;
  };
  hasClaim: boolean;
  claimStatus: {
    verified: boolean;
    fulfillmentStatus: string;
  } | null;
}

interface Giveaway {
  id: number;
  title: string;
  prizeTitle: string;
  status: string;
  winnerSelected: boolean;
}

export default function WinnersPage() {
  const params = useParams();
  const id = params.id as string;
  const [winners, setWinners] = useState<Winner[]>([]);
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [notifyChannel, setNotifyChannel] = useState<Record<number, string>>({});
  const [notifyResult, setNotifyResult] = useState<{winnerId: number; success: boolean; message: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      // Fetch giveaway details
      const giveawayRes = await fetch(`/api/giveaways/${id}`, {
        credentials: 'include',
      });
      if (giveawayRes.ok) {
        const giveawayResult = await giveawayRes.json();
        setGiveaway(giveawayResult.data);
      }

      // Fetch winners
      const winnersRes = await fetch(`/api/giveaways/${id}/winners`, {
        credentials: 'include',
      });
      if (winnersRes.ok) {
        const winnersResult = await winnersRes.json();
        setWinners(winnersResult.data.winners || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(winnerId: number, action: string, channel?: string) {
    const actionLabels: Record<string, string> = {
      notify: 'send notification to',
      forfeit: 'forfeit',
      disqualify: 'disqualify',
      promote: 'promote',
    };

    if (!confirm(`Are you sure you want to ${actionLabels[action]} this winner?`)) {
      return;
    }

    setActionLoading(winnerId);
    setNotifyResult(null);

    try {
      const body: any = { winnerId, action };
      if (action === 'notify' && channel) {
        body.channel = channel;
      }

      const res = await fetch(`/api/giveaways/${id}/winners`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Failed to ${action} winner`);
      }

      // Show notification result for notify action
      if (action === 'notify' && result.data?.notification) {
        const notif = result.data.notification;
        setNotifyResult({
          winnerId,
          success: notif.emailSent || notif.smsSent,
          message: `${notif.emailSent ? 'Email sent' : 'Email failed'}${notif.smsSent !== undefined ? `, ${notif.smsSent ? 'SMS sent' : 'SMS failed'}` : ''}`,
        });
      }

      // Refresh data
      await fetchData();
    } catch (err: any) {
      setNotifyResult({
        winnerId,
        success: false,
        message: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  }

  function getChannelForWinner(winnerId: number): string {
    return notifyChannel[winnerId] || 'both';
  }

  function setChannelForWinner(winnerId: number, channel: string) {
    setNotifyChannel(prev => ({ ...prev, [winnerId]: channel }));
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      notified: 'bg-blue-100 text-blue-800',
      claimed: 'bg-green-100 text-green-800',
      forfeited: 'bg-red-100 text-red-800',
      disqualified: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading winners...</p>
        </div>
      </div>
    );
  }

  const primaryWinners = winners.filter(w => w.winnerType === 'primary');
  const alternateWinners = winners.filter(w => w.winnerType === 'alternate').sort((a, b) => (a.alternateOrder || 0) - (b.alternateOrder || 0));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/giveaways/${id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Winners</h1>
            <p className="text-gray-600">{giveaway?.title || 'Giveaway'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/giveaways/${id}/entries`}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Entries
          </Link>
          <Link
            href={`/admin/giveaways/${id}`}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Edit Giveaway
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {winners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Winners Selected Yet</h3>
          <p className="text-gray-500 mb-4">Winners haven&apos;t been selected for this giveaway.</p>
          <Link
            href={`/admin/giveaways/${id}`}
            className="text-blue-600 hover:underline"
          >
            Go to giveaway settings to select winners
          </Link>
        </div>
      ) : (
        <>
          {/* Primary Winners */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Primary Winners ({primaryWinners.length})
              </h2>
            </div>

            {primaryWinners.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No primary winners</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {primaryWinners.map((winner) => (
                      <tr key={winner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {winner.entry.firstName} {winner.entry.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{winner.entry.state}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{winner.entry.email}</div>
                          <div className="text-sm text-gray-500">{winner.entry.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(winner.status)}`}>
                            {winner.status}
                          </span>
                          {winner.hasClaim && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              {winner.claimStatus?.fulfillmentStatus || 'claimed'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {winner.notifiedAt ? (
                            <div>
                              {formatDate(winner.notifiedAt)}
                              <div className="text-xs text-gray-400">{winner.notificationMethod}</div>
                            </div>
                          ) : (
                            <span className="text-yellow-600">Not sent</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(winner.claimDeadline)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {(winner.status === 'pending' || winner.status === 'notified') && !winner.hasClaim && (
                              <>
                                <div className="flex items-center gap-1">
                                  <select
                                    value={getChannelForWinner(winner.id)}
                                    onChange={(e) => setChannelForWinner(winner.id, e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="both">Email + SMS</option>
                                    <option value="email">Email Only</option>
                                    <option value="sms">SMS Only</option>
                                  </select>
                                  <button
                                    onClick={() => handleAction(winner.id, 'notify', getChannelForWinner(winner.id))}
                                    disabled={actionLoading === winner.id}
                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                                  >
                                    {actionLoading === winner.id ? '...' : 'Send'}
                                  </button>
                                </div>
                                {notifyResult && notifyResult.winnerId === winner.id && (
                                  <div className={`text-xs px-2 py-1 rounded ${notifyResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {notifyResult.message}
                                  </div>
                                )}
                                <button
                                  onClick={() => handleAction(winner.id, 'forfeit')}
                                  disabled={actionLoading === winner.id}
                                  className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded hover:bg-orange-100 disabled:opacity-50"
                                >
                                  Forfeit
                                </button>
                                <button
                                  onClick={() => handleAction(winner.id, 'disqualify')}
                                  disabled={actionLoading === winner.id}
                                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                                >
                                  Disqualify
                                </button>
                              </>
                            )}
                            {winner.hasClaim && (
                              <span className="text-xs text-green-600 font-medium">Prize Claimed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Alternate Winners */}
          {alternateWinners.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Alternate Winners ({alternateWinners.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {alternateWinners.map((winner) => (
                      <tr key={winner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                            #{winner.alternateOrder}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {winner.entry.firstName} {winner.entry.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{winner.entry.state}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{winner.entry.email}</div>
                          <div className="text-sm text-gray-500">{winner.entry.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(winner.status)}`}>
                            {winner.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {winner.status === 'pending' && (
                              <button
                                onClick={() => handleAction(winner.id, 'promote')}
                                disabled={actionLoading === winner.id}
                                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50"
                              >
                                {actionLoading === winner.id ? '...' : 'Promote to Primary'}
                              </button>
                            )}
                            {winner.status === 'pending' && (
                              <button
                                onClick={() => handleAction(winner.id, 'disqualify')}
                                disabled={actionLoading === winner.id}
                                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                              >
                                Disqualify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
