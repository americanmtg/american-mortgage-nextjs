'use client';

import { useEffect, useState, useRef } from 'react';

interface MenuItem {
  id?: number;
  label: string;
  url: string;
  openInNewTab?: boolean;
  enabled?: boolean;
  showOnDesktop?: boolean;
  showOnMobileBar?: boolean;
  showInHamburger?: boolean;
  children?: MenuItem[];
}

interface Navigation {
  mainMenu?: MenuItem[];
}

interface MobileButton {
  id?: number;
  label: string;
  url: string;
  icon: string;
  buttonType: 'solid' | 'outline';
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  isActive: boolean;
}

const ICON_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'phone', label: 'Phone' },
  { value: 'arrow-right', label: 'Arrow Right' },
  { value: 'home', label: 'Home' },
  { value: 'calculator', label: 'Calculator' },
  { value: 'document', label: 'Document' },
  { value: 'user', label: 'User' },
  { value: 'chat', label: 'Chat' },
  { value: 'mail', label: 'Email' },
  { value: 'calendar', label: 'Calendar' },
];

export default function MenuManagement() {
  const [navigation, setNavigation] = useState<Navigation>({ mainMenu: [] });
  const [mobileButtons, setMobileButtons] = useState<MobileButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingButtons, setSavingButtons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingButtonIndex, setEditingButtonIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'navigation' | 'mobileButtons'>('navigation');

  // Drag and drop state
  const [draggedMenuIndex, setDraggedMenuIndex] = useState<number | null>(null);
  const [dragOverMenuIndex, setDragOverMenuIndex] = useState<number | null>(null);
  const [draggedButtonIndex, setDraggedButtonIndex] = useState<number | null>(null);
  const [dragOverButtonIndex, setDragOverButtonIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchNavigation();
    fetchMobileButtons();
  }, []);

  async function fetchNavigation() {
    try {
      const res = await fetch('/api/settings/navigation', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setNavigation(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch navigation:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMobileButtons() {
    try {
      const res = await fetch('/api/settings/mobile-menu-buttons', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data?.buttons) {
          setMobileButtons(result.data.buttons);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mobile buttons:', err);
    }
  }

  async function saveNavigation() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/settings/navigation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(navigation),
      });

      if (res.ok) {
        setSuccess('Menu saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchNavigation();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save menu. Make sure you are logged in.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMobileButtons() {
    setSavingButtons(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/settings/mobile-menu-buttons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ buttons: mobileButtons }),
      });

      if (res.ok) {
        setSuccess('Mobile buttons saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchMobileButtons();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save mobile buttons. Make sure you are logged in.');
    } finally {
      setSavingButtons(false);
    }
  }

  function addMenuItem() {
    const newItem: MenuItem = {
      label: '',
      url: '/',
      openInNewTab: false,
      enabled: true,
      showOnDesktop: true,
      showOnMobileBar: false,
      showInHamburger: true,
    };
    setNavigation({
      ...navigation,
      mainMenu: [...(navigation.mainMenu || []), newItem],
    });
    setEditingIndex((navigation.mainMenu?.length || 0));
  }

  function updateMenuItem(index: number, updates: Partial<MenuItem>) {
    const newMenu = [...(navigation.mainMenu || [])];
    newMenu[index] = { ...newMenu[index], ...updates };
    setNavigation({ ...navigation, mainMenu: newMenu });
  }

  function removeMenuItem(index: number) {
    const newMenu = [...(navigation.mainMenu || [])];
    newMenu.splice(index, 1);
    setNavigation({ ...navigation, mainMenu: newMenu });
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }

  function moveMenuItem(index: number, direction: 'up' | 'down') {
    const newMenu = [...(navigation.mainMenu || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newMenu.length) return;

    [newMenu[index], newMenu[newIndex]] = [newMenu[newIndex], newMenu[index]];
    setNavigation({ ...navigation, mainMenu: newMenu });

    if (editingIndex === index) {
      setEditingIndex(newIndex);
    } else if (editingIndex === newIndex) {
      setEditingIndex(index);
    }
  }

  // Drag and drop handlers for menu items
  function handleMenuDragStart(e: React.DragEvent, index: number) {
    setDraggedMenuIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to apply the dragging style
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  }

  function handleMenuDragEnd() {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedMenuIndex(null);
    setDragOverMenuIndex(null);
    dragNodeRef.current = null;
  }

  function handleMenuDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedMenuIndex === null || draggedMenuIndex === index) return;
    setDragOverMenuIndex(index);
  }

  function handleMenuDragLeave() {
    setDragOverMenuIndex(null);
  }

  function handleMenuDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedMenuIndex === null || draggedMenuIndex === dropIndex) return;

    const newMenu = [...(navigation.mainMenu || [])];
    const [draggedItem] = newMenu.splice(draggedMenuIndex, 1);
    newMenu.splice(dropIndex, 0, draggedItem);
    setNavigation({ ...navigation, mainMenu: newMenu });

    // Update editing index if needed
    if (editingIndex === draggedMenuIndex) {
      setEditingIndex(dropIndex);
    } else if (editingIndex !== null) {
      if (draggedMenuIndex < editingIndex && dropIndex >= editingIndex) {
        setEditingIndex(editingIndex - 1);
      } else if (draggedMenuIndex > editingIndex && dropIndex <= editingIndex) {
        setEditingIndex(editingIndex + 1);
      }
    }

    setDraggedMenuIndex(null);
    setDragOverMenuIndex(null);
  }

  // Mobile Button functions
  function addMobileButton() {
    const newButton: MobileButton = {
      label: 'New Button',
      url: '/',
      icon: 'none',
      buttonType: 'outline',
      backgroundColor: '#ffffff',
      textColor: '#0f2e71',
      borderColor: '#0f2e71',
      isActive: true,
    };
    setMobileButtons([...mobileButtons, newButton]);
    setEditingButtonIndex(mobileButtons.length);
  }

  function updateMobileButton(index: number, updates: Partial<MobileButton>) {
    const newButtons = [...mobileButtons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setMobileButtons(newButtons);
  }

  function removeMobileButton(index: number) {
    const newButtons = [...mobileButtons];
    newButtons.splice(index, 1);
    setMobileButtons(newButtons);
    if (editingButtonIndex === index) {
      setEditingButtonIndex(null);
    } else if (editingButtonIndex !== null && editingButtonIndex > index) {
      setEditingButtonIndex(editingButtonIndex - 1);
    }
  }

  function moveMobileButton(index: number, direction: 'up' | 'down') {
    const newButtons = [...mobileButtons];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newButtons.length) return;

    [newButtons[index], newButtons[newIndex]] = [newButtons[newIndex], newButtons[index]];
    setMobileButtons(newButtons);

    if (editingButtonIndex === index) {
      setEditingButtonIndex(newIndex);
    } else if (editingButtonIndex === newIndex) {
      setEditingButtonIndex(index);
    }
  }

  // Drag and drop handlers for mobile buttons
  function handleButtonDragStart(e: React.DragEvent, index: number) {
    setDraggedButtonIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  }

  function handleButtonDragEnd() {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedButtonIndex(null);
    setDragOverButtonIndex(null);
    dragNodeRef.current = null;
  }

  function handleButtonDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedButtonIndex === null || draggedButtonIndex === index) return;
    setDragOverButtonIndex(index);
  }

  function handleButtonDragLeave() {
    setDragOverButtonIndex(null);
  }

  function handleButtonDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedButtonIndex === null || draggedButtonIndex === dropIndex) return;

    const newButtons = [...mobileButtons];
    const [draggedItem] = newButtons.splice(draggedButtonIndex, 1);
    newButtons.splice(dropIndex, 0, draggedItem);
    setMobileButtons(newButtons);

    // Update editing index if needed
    if (editingButtonIndex === draggedButtonIndex) {
      setEditingButtonIndex(dropIndex);
    } else if (editingButtonIndex !== null) {
      if (draggedButtonIndex < editingButtonIndex && dropIndex >= editingButtonIndex) {
        setEditingButtonIndex(editingButtonIndex - 1);
      } else if (draggedButtonIndex > editingButtonIndex && dropIndex <= editingButtonIndex) {
        setEditingButtonIndex(editingButtonIndex + 1);
      }
    }

    setDraggedButtonIndex(null);
    setDragOverButtonIndex(null);
  }

  function renderIconPreview(icon: string, color: string = '#0f2e71') {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case 'phone':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'arrow-right':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        );
      case 'home':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'calculator':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'document':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'user':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'chat':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'mail':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage navigation and mobile menu buttons.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('navigation')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'navigation'
                ? 'border-navy text-navy dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Navigation Menu
          </button>
          <button
            onClick={() => setActiveTab('mobileButtons')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'mobileButtons'
                ? 'border-navy text-navy dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Mobile Menu Buttons
          </button>
        </nav>
      </div>

      {/* Navigation Tab */}
      {activeTab === 'navigation' && (
        <>
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={addMenuItem}
              className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
            <button
              onClick={saveNavigation}
              disabled={saving}
              className="px-4 py-2 bg-red text-white rounded-lg font-medium hover:bg-red-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Menu Items List */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            {!navigation.mainMenu || navigation.mainMenu.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No menu items yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by adding your first menu item.</p>
                <button
                  onClick={addMenuItem}
                  className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors"
                >
                  Add Menu Item
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {navigation.mainMenu.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 transition-all ${
                      dragOverMenuIndex === index && draggedMenuIndex !== index
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : ''
                    } ${editingIndex !== index ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    draggable={editingIndex !== index}
                    onDragStart={(e) => handleMenuDragStart(e, index)}
                    onDragEnd={handleMenuDragEnd}
                    onDragOver={(e) => handleMenuDragOver(e, index)}
                    onDragLeave={handleMenuDragLeave}
                    onDrop={(e) => handleMenuDrop(e, index)}
                  >
                    {editingIndex === index ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Label
                            </label>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => updateMenuItem(index, { label: e.target.value })}
                              placeholder="e.g., About Us"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              URL
                            </label>
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => updateMenuItem(index, { url: e.target.value })}
                              placeholder="e.g., /about or https://..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled !== false}
                              onChange={(e) => updateMenuItem(index, { enabled: e.target.checked })}
                              className="w-4 h-4 text-navy rounded focus:ring-navy"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.openInNewTab || false}
                              onChange={(e) => updateMenuItem(index, { openInNewTab: e.target.checked })}
                              className="w-4 h-4 text-navy rounded focus:ring-navy"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Open in new tab</span>
                          </label>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Visibility</p>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.showOnDesktop !== false}
                                onChange={(e) => updateMenuItem(index, { showOnDesktop: e.target.checked })}
                                className="w-4 h-4 text-navy rounded focus:ring-navy"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Desktop Nav</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.showOnMobileBar || false}
                                onChange={(e) => updateMenuItem(index, { showOnMobileBar: e.target.checked })}
                                className="w-4 h-4 text-navy rounded focus:ring-navy"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Mobile Bar</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.showInHamburger !== false}
                                onChange={(e) => updateMenuItem(index, { showInHamburger: e.target.checked })}
                                className="w-4 h-4 text-navy rounded focus:ring-navy"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Hamburger Menu</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Drag Handle */}
                          <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Content */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${item.enabled === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                {item.label || '(No label)'}
                              </span>
                              {item.enabled === false && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                                  Disabled
                                </span>
                              )}
                              {item.openInNewTab && (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{item.url}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                {item.showOnDesktop !== false && (
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Desktop</span>
                                )}
                                {item.showOnMobileBar && (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">Mobile Bar</span>
                                )}
                                {item.showInHamburger !== false && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">Hamburger</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="p-2 text-gray-400 hover:text-navy dark:hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeMenuItem(index)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Drag and drop</strong> menu items to reorder them. Grab the handle icon on the left and drag.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Use relative URLs (e.g., /about) for internal pages and full URLs for external links.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Desktop Nav:</strong> Shows in the main navigation bar on desktop screens.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Mobile Bar:</strong> Shows in the quick-access bar below the header on mobile.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Hamburger Menu:</strong> Shows when the mobile hamburger menu is opened.
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Mobile Buttons Tab */}
      {activeTab === 'mobileButtons' && (
        <>
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={addMobileButton}
              className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Button
            </button>
            <button
              onClick={saveMobileButtons}
              disabled={savingButtons}
              className="px-4 py-2 bg-red text-white rounded-lg font-medium hover:bg-red-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingButtons ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Mobile Buttons List */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            {mobileButtons.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No mobile buttons yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Add buttons that appear in the mobile hamburger menu.</p>
                <button
                  onClick={addMobileButton}
                  className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors"
                >
                  Add Button
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {mobileButtons.map((btn, index) => (
                  <div
                    key={index}
                    className={`p-4 transition-all ${
                      dragOverButtonIndex === index && draggedButtonIndex !== index
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : ''
                    } ${editingButtonIndex !== index ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    draggable={editingButtonIndex !== index}
                    onDragStart={(e) => handleButtonDragStart(e, index)}
                    onDragEnd={handleButtonDragEnd}
                    onDragOver={(e) => handleButtonDragOver(e, index)}
                    onDragLeave={handleButtonDragLeave}
                    onDrop={(e) => handleButtonDrop(e, index)}
                  >
                    {editingButtonIndex === index ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Button Label
                            </label>
                            <input
                              type="text"
                              value={btn.label}
                              onChange={(e) => updateMobileButton(index, { label: e.target.value })}
                              placeholder="e.g., Apply Now"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              URL
                            </label>
                            <input
                              type="text"
                              value={btn.url}
                              onChange={(e) => updateMobileButton(index, { url: e.target.value })}
                              placeholder="e.g., /apply or tel:+1234567890"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Icon
                            </label>
                            <select
                              value={btn.icon || 'none'}
                              onChange={(e) => updateMobileButton(index, { icon: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                            >
                              {ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Button Style
                            </label>
                            <select
                              value={btn.buttonType}
                              onChange={(e) => updateMobileButton(index, { buttonType: e.target.value as 'solid' | 'outline' })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                            >
                              <option value="solid">Solid (filled background)</option>
                              <option value="outline">Outline (border only)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Background Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={btn.backgroundColor}
                                onChange={(e) => updateMobileButton(index, { backgroundColor: e.target.value })}
                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={btn.backgroundColor}
                                onChange={(e) => updateMobileButton(index, { backgroundColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Text Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={btn.textColor}
                                onChange={(e) => updateMobileButton(index, { textColor: e.target.value })}
                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={btn.textColor}
                                onChange={(e) => updateMobileButton(index, { textColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Border Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={btn.borderColor}
                                onChange={(e) => updateMobileButton(index, { borderColor: e.target.value })}
                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={btn.borderColor}
                                onChange={(e) => updateMobileButton(index, { borderColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preview
                          </label>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                            <button
                              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded font-semibold transition-colors"
                              style={{
                                backgroundColor: btn.backgroundColor,
                                color: btn.textColor,
                                border: `2px solid ${btn.borderColor}`,
                              }}
                            >
                              {btn.icon && btn.icon !== 'none' && renderIconPreview(btn.icon, btn.textColor)}
                              {btn.label}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={btn.isActive}
                              onChange={(e) => updateMobileButton(index, { isActive: e.target.checked })}
                              className="w-4 h-4 text-navy rounded focus:ring-navy"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                          </label>
                          <button
                            onClick={() => setEditingButtonIndex(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Drag Handle */}
                          <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Preview Button */}
                          <div
                            className="flex items-center gap-2 px-4 py-2 rounded font-medium text-sm"
                            style={{
                              backgroundColor: btn.backgroundColor,
                              color: btn.textColor,
                              border: `2px solid ${btn.borderColor}`,
                            }}
                          >
                            {btn.icon && btn.icon !== 'none' && renderIconPreview(btn.icon, btn.textColor)}
                            {btn.label}
                          </div>

                          {/* Info */}
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{btn.url}</span>
                            {!btn.isActive && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingButtonIndex(index)}
                            className="p-2 text-gray-400 hover:text-navy dark:hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeMobileButton(index)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Mobile Button Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Drag and drop</strong> buttons to reorder them. Grab the handle icon on the left and drag.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                These buttons appear at the bottom of the mobile hamburger menu.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                For phone calls, use <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">tel:+1234567890</code> as the URL.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Solid:</strong> Button has a filled background color.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Outline:</strong> Button has a transparent background with a colored border.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
