'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  pages: number;
  blogPosts: number;
  menuItems: number;
  media: number;
}

async function fetchStats(): Promise<Stats> {
  try {
    const [pagesRes, blogRes, navRes, mediaRes] = await Promise.all([
      fetch('/api/pages'),
      fetch('/api/blog-posts'),
      fetch('/api/settings/navigation'),
      fetch('/api/media'),
    ]);

    const pages = pagesRes.ok ? await pagesRes.json() : { docs: [], totalDocs: 0 };
    const blog = blogRes.ok ? await blogRes.json() : { docs: [], totalDocs: 0 };
    const nav = navRes.ok ? await navRes.json() : { mainMenu: [] };
    const media = mediaRes.ok ? await mediaRes.json() : { docs: [], totalDocs: 0 };

    return {
      pages: pages.totalDocs || pages.docs?.length || 0,
      blogPosts: blog.totalDocs || blog.docs?.length || 0,
      menuItems: nav.mainMenu?.length || 0,
      media: media.totalDocs || media.docs?.length || 0,
    };
  } catch {
    return { pages: 0, blogPosts: 0, menuItems: 0, media: 0 };
  }
}

// Mini bar chart component
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, i) => (
        <div
          key={i}
          className={`w-2 rounded-sm ${color}`}
          style={{ height: `${(value / max) * 100}%`, opacity: 0.3 + (i / data.length) * 0.7 }}
        />
      ))}
    </div>
  );
}

// Stat card icon components
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ pages: 0, blogPosts: 0, menuItems: 0, media: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const statCards = [
    {
      label: 'Pages',
      value: stats.pages,
      change: '+15%',
      changeType: 'positive',
      href: '/admin/pages',
      icon: CalendarIcon,
      chartData: [3, 5, 4, 6, 5, 7, 6, 8],
      chartColor: 'bg-blue-500',
    },
    {
      label: 'Blog Posts',
      value: stats.blogPosts,
      change: '-15%',
      changeType: 'negative',
      href: '/admin/blog',
      icon: UserIcon,
      chartData: [8, 7, 6, 5, 6, 4, 5, 4],
      chartColor: 'bg-blue-500',
    },
    {
      label: 'Menu Items',
      value: stats.menuItems,
      change: '+15%',
      changeType: 'positive',
      href: '/admin/menu',
      icon: ChartIcon,
      chartData: [2, 3, 4, 3, 5, 4, 6, 5],
      chartColor: 'bg-blue-500',
    },
    {
      label: 'Media Files',
      value: stats.media,
      change: '-15%',
      changeType: 'negative',
      href: '/admin/media',
      icon: CurrencyIcon,
      chartData: [6, 7, 5, 8, 6, 7, 5, 6],
      chartColor: 'bg-blue-500',
    },
  ];

  const quickActions = [
    { label: 'Add Page', href: '/admin/pages', external: false },
    { label: 'New Blog Post', href: '/admin/blog', external: false },
    { label: 'Edit Menu', href: '/admin/menu', external: false },
    { label: 'Site Settings', href: '/admin/settings', external: false },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards - styled like reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Icon />
                  <span className="text-sm font-medium">{card.label}</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : card.value.toLocaleString()}
                  </p>
                  <p className={`text-sm mt-1 ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                    {card.change} <span className="text-gray-400">vs last month</span>
                  </p>
                </div>
                <MiniChart data={card.chartData} color={card.chartColor} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two column layout like reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area - Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-center gap-2 px-4 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
              >
                {action.label}
                {action.external && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            ))}
          </div>

          {/* Getting Started Section */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">Manage Your Navigation</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Use the Menu section to add, remove, or reorder navigation items.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">Content Management</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Use the admin panel for full content editing capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar area - Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Site Overview</h2>
          </div>

          {/* Donut chart placeholder */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="4" className="dark:stroke-gray-800" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="60 40" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-60" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Content Items</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {loading ? '...' : stats.pages + stats.blogPosts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Media Files</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {loading ? '...' : stats.media}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
