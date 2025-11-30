'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Auth context
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Theme context - DISABLED, always light mode
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

// Always returns light mode
export const useTheme = () => ({ isDark: false, toggleTheme: () => {} });

// Sidebar context
interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
        // Redirect to login if not on login page
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }
    refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }

    // Check for saved sidebar state
    const savedSidebar = localStorage.getItem('admin-sidebar-collapsed');
    if (savedSidebar === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      localStorage.setItem('admin-theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('admin-sidebar-collapsed', newValue.toString());
      return newValue;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshSession }}>
      <ThemeContext.Provider value={{ isDark, toggleTheme }}>
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
          {children}
        </SidebarContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
