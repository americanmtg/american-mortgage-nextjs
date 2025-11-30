'use client';

import { useEffect, useState, useRef } from 'react';

interface MediaItem {
  id: number;
  filename: string | null;
  mimeType: string | null;
  url: string | null;
  width?: number | null;
  height?: number | null;
  filesize: number | null;
  createdAt: string;
  alt?: string | null;
  label?: string | null;
}

export default function MediaManagement() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingLabel, setEditingLabel] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    try {
      const res = await fetch('/api/media', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setMedia(result.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes: number | null) {
    if (bytes === null || bytes === undefined) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isImage(mimeType: string | null) {
    return mimeType?.startsWith('image/') ?? false;
  }

  function getMediaUrl(url: string | null): string {
    if (!url) return '/placeholder.png';
    return url.startsWith('/') ? url : '/' + url;
  }

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setError(null);

    let uploadedCount = 0;
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', file.name);

        const res = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (res.ok) {
          uploadedCount++;
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error(`Failed to upload ${file.name}:`, errorData);
        }
      }

      if (uploadedCount > 0) {
        setSuccess(`Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? 's' : ''}`);
        setTimeout(() => setSuccess(null), 3000);
        fetchMedia();
      }

      if (uploadedCount < totalFiles) {
        setError(`Failed to upload ${totalFiles - uploadedCount} file${totalFiles - uploadedCount > 1 ? 's' : ''}. Make sure you are logged in.`);
      }
    } catch (err) {
      setError('Failed to upload files. Make sure you are logged in.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function deleteMedia(item: MediaItem) {
    if (!confirm(`Are you sure you want to delete "${item.filename}"? This action cannot be undone.`)) return;

    setDeleting(item.id);
    setError(null);

    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess('File deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        setSelectedItem(null);
        fetchMedia();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      setError('Failed to delete. Make sure you are logged in.');
    } finally {
      setDeleting(null);
    }
  }

  function copyUrl(item: MediaItem) {
    if (!item.url) return;
    const fullUrl = window.location.origin + getMediaUrl(item.url);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFiles(files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function saveLabel(item: MediaItem, newLabel: string) {
    setSavingLabel(true);
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: newLabel.trim() || null }),
      });

      if (res.ok) {
        // Update the media list with the new label
        setMedia(media.map(m =>
          m.id === item.id ? { ...m, label: newLabel.trim() || null } : m
        ));
        // Update selectedItem if it's the same item
        if (selectedItem?.id === item.id) {
          setSelectedItem({ ...selectedItem, label: newLabel.trim() || null });
        }
        setSuccess('Label saved');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error('Failed to save label');
      }
    } catch (err) {
      setError('Failed to save label. Make sure you are logged in.');
    } finally {
      setSavingLabel(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {media.length} file{media.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title="Grid view"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title="List view"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            uploadFiles(files);
          }
        }}
      />

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

      {/* Drop Zone / Empty State */}
      {media.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        >
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No media uploaded yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Drag and drop files here, or click the button below</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Select Files
          </button>
        </div>
      ) : (
        <>
          {/* Drop Zone Overlay */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mb-4 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            Drag and drop files here to upload
          </div>

          {/* Media Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    {isImage(item.mimeType) && item.url ? (
                      <img
                        src={getMediaUrl(item.url)}
                        alt={item.alt || item.filename || 'Media'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyUrl(item);
                        }}
                        className="p-2 bg-white/90 rounded-full hover:bg-white"
                        title="Copy URL"
                      >
                        {copiedId === item.id ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMedia(item);
                        }}
                        disabled={deleting === item.id}
                        className="p-2 bg-white/90 rounded-full hover:bg-white"
                        title="Delete"
                      >
                        {deleting === item.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs text-gray-900 dark:text-white truncate font-medium">
                      {item.filename || 'Unknown'}
                    </p>
                    {item.label && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                        {item.label}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(item.filesize)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Media List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {media.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                            {isImage(item.mimeType) && item.url ? (
                              <img
                                src={getMediaUrl(item.url)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {item.filename || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.mimeType || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(item.filesize)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyUrl(item);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Copy URL"
                          >
                            {copiedId === item.id ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMedia(item);
                            }}
                            disabled={deleting === item.id}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === item.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {selectedItem.filename}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {/* Preview */}
              <div className="mb-6">
                {isImage(selectedItem.mimeType) && selectedItem.url ? (
                  <img
                    src={getMediaUrl(selectedItem.url)}
                    alt={selectedItem.alt || selectedItem.filename || 'Media'}
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">No preview available</p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">File name</span>
                  <span className="text-gray-900 dark:text-white font-medium">{selectedItem.filename || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-gray-900 dark:text-white">{selectedItem.mimeType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Size</span>
                  <span className="text-gray-900 dark:text-white">{formatFileSize(selectedItem.filesize)}</span>
                </div>
                {selectedItem.width && selectedItem.height && (
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Dimensions</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.width} x {selectedItem.height}px</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Uploaded</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(selectedItem.createdAt)}</span>
                </div>

                {/* Label */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Label
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onFocus={() => setEditingLabel(selectedItem.label || '')}
                      placeholder="e.g., Site Logo, OG Image, Footer Logo"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => saveLabel(selectedItem, editingLabel)}
                      disabled={savingLabel}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingLabel ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                  {selectedItem.label && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Current: <span className="text-blue-600 dark:text-blue-400">{selectedItem.label}</span>
                    </p>
                  )}
                </div>

                {/* URL */}
                {selectedItem.url && (
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getMediaUrl(selectedItem.url)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => copyUrl(selectedItem)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                      >
                        {copiedId === selectedItem.id ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => deleteMedia(selectedItem)}
                disabled={deleting === selectedItem.id}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting === selectedItem.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete File
                  </>
                )}
              </button>
              {selectedItem.url && (
                <a
                  href={getMediaUrl(selectedItem.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in New Tab
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
