'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar, useAuth, useTheme } from './AdminContext';
import { ReactNode, useEffect, useState, useRef } from 'react';

interface SiteSettings {
  logo?: {
    url?: string;
  };
  logoHeight?: number;
}

// Icons - clean outline style like the reference
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const PagesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const BlogIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
  </svg>
);

const MediaIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const RoutesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const FooterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

const LoansIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const ViewSiteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

interface MenuItem {
  label: string;
  href: string;
  icon: React.FC;
  roles?: string[]; // If specified, only these roles can see it
}

const SeoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
  </svg>
);

const HeaderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: DashboardIcon },
  { label: 'Menu', href: '/admin/menu', icon: MenuIcon, roles: ['admin'] },
  { label: 'Pages', href: '/admin/pages', icon: PagesIcon, roles: ['admin'] },
  { label: 'Blog Posts', href: '/admin/blog', icon: BlogIcon },
  { label: 'Media', href: '/admin/media', icon: MediaIcon },
  { label: 'Routes', href: '/admin/routes', icon: RoutesIcon, roles: ['admin'] },
  { label: 'Footer', href: '/admin/footer', icon: FooterIcon, roles: ['admin'] },
  { label: 'Featured Loans', href: '/admin/loans', icon: LoansIcon, roles: ['admin'] },
  { label: 'Header', href: '/admin/header', icon: HeaderIcon, roles: ['admin'] },
  { label: 'SEO', href: '/admin/seo', icon: SeoIcon, roles: ['admin'] },
  { label: 'View Site', href: '/admin/view-site', icon: ViewSiteIcon },
  { label: 'Settings', href: '/admin/settings', icon: SettingsIcon, roles: ['admin'] },
  { label: 'Users', href: '/admin/users', icon: UsersIcon, roles: ['admin'] },
];

function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();
      
  

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white`}
    >
      {/* Logo */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
        <Link href="/admin" className="flex items-center gap-3" style={{ minHeight: '50px' }}>
          <Image
            src="/cms-media/file/png-01.png"
            alt="American Mortgage"
            width={isCollapsed ? 40 : 180}
            height={50}
            className="object-contain"
            style={{ height: isCollapsed ? '40px' : '50px', width: 'auto' }}
            unoptimized
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-50 ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <CollapseIcon isCollapsed={isCollapsed} />
          {!isCollapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'blog_editor':
        return 'Blog Editor';
      default:
        return role;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {user ? getInitials(user.name) : 'AD'}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user?.name || 'Admin User'}
          </p>
          <p className="text-xs text-gray-500">
            {user ? getRoleLabel(user.role) : 'Administrator'}
          </p>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-500`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg border bg-white border-gray-200 overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-sm text-gray-500">
              {user?.email || 'admin@example.com'}
            </p>
            <span
              className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                user?.role === 'admin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {user ? getRoleLabel(user.role) : 'Administrator'}
            </span>
          </div>

          {/* Logout Button */}
          <div className="p-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-600 hover:bg-red-50"
            >
              <LogoutIcon />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar() {
  const { isCollapsed } = useSidebar();
  const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true';

  return (
    <header
      className={`fixed right-0 h-16 z-30 transition-all duration-300 flex items-center justify-between px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      } bg-[#f8fafc]`}
      style={{ top: isStaging ? '40px' : '0' }}
    >
      {/* Search Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white shadow-sm border border-gray-200">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent border-none outline-none w-48 text-sm text-gray-700 placeholder-gray-400"
        />
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
          ⌘F
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* User Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}

// Staging banner component
function StagingBanner() {
  const { isCollapsed } = useSidebar();
  const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true';

  if (!isStaging) return null;

  return (
    <div
      className={`fixed top-0 right-0 h-10 z-50 flex items-center justify-center bg-orange-500 text-white font-semibold text-sm transition-all duration-300 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      STAGING ENVIRONMENT - Changes here will NOT affect production
    </div>
  );
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true';

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Don't show shell on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, show loading (redirect will happen)
  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <StagingBanner />
      <Sidebar />
      <TopBar />
      <main
        className={`transition-all duration-300 min-h-screen ${
          isCollapsed ? 'pl-20' : 'pl-64'
        } ${isStaging ? 'pt-26' : 'pt-16'}`}
        style={{ paddingTop: isStaging ? '104px' : '64px' }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
