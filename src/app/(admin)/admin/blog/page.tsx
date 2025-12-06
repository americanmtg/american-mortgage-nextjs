'use client';

import { useEffect, useState, useRef } from 'react';

interface Author {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  nmlsId: string | null;
  bio: string | null;
  photoId: number | null;
  photoUrl: string | null;
  isActive: boolean;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  publishedAt: string;
  updatedAt: string;
  status?: 'draft' | 'published';
  authorId?: number | null;
  authorRef?: Author | null;
  featuredImage?: {
    id?: number;
    url: string;
    filename: string;
  };
}

interface EditingPost {
  id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published';
  authorId?: number | null;
  featuredImage?: {
    id?: number;
    url: string;
    filename: string;
  };
}

interface EditingAuthor {
  id?: number;
  name: string;
  email: string;
  phone: string;
  nmlsId: string;
  bio: string;
  photoId: number | null;
  photoUrl: string | null;
  isActive: boolean;
}

const emptyPost: EditingPost = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  status: 'draft',
  authorId: null,
};

const emptyAuthor: EditingAuthor = {
  name: '',
  email: '',
  phone: '',
  nmlsId: '',
  bio: '',
  photoId: null,
  photoUrl: null,
  isActive: true,
};

export default function BlogManagement() {
  const [activeTab, setActiveTab] = useState<'posts' | 'authors'>('posts');

  // Posts state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Authors state
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [editingAuthor, setEditingAuthor] = useState<EditingAuthor | null>(null);
  const [isCreatingAuthor, setIsCreatingAuthor] = useState(false);

  // Shared state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const postImageInputRef = useRef<HTMLInputElement>(null);
  const authorImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    fetchAuthors();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/blog-posts', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setPosts(result.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function fetchAuthors() {
    try {
      const res = await fetch('/api/authors', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setAuthors(result.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch authors:', err);
    } finally {
      setLoadingAuthors(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Post functions
  function startCreatingPost() {
    setEditingPost({ ...emptyPost });
    setIsCreatingPost(true);
  }

  function startEditingPost(post: BlogPost) {
    setEditingPost({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content || '',
      excerpt: post.excerpt || '',
      status: post.status || 'published',
      authorId: post.authorId || null,
      featuredImage: post.featuredImage,
    });
    setIsCreatingPost(false);
  }

  function cancelEditingPost() {
    setEditingPost(null);
    setIsCreatingPost(false);
    setError(null);
  }

  async function savePost() {
    if (!editingPost) return;
    if (!editingPost.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const slug = editingPost.slug || generateSlug(editingPost.title);

      const payload: Record<string, unknown> = {
        title: editingPost.title,
        slug,
        content: editingPost.content,
        excerpt: editingPost.excerpt,
        authorId: editingPost.authorId || null,
        publishedAt: editingPost.status === 'published' ? new Date().toISOString() : undefined,
      };

      if (editingPost.featuredImage?.id) {
        payload.featuredImageId = editingPost.featuredImage.id;
      }

      const url = isCreatingPost
        ? '/api/blog-posts'
        : `/api/blog-posts/${editingPost.id}`;

      const res = await fetch(url, {
        method: isCreatingPost ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(isCreatingPost ? 'Post created successfully!' : 'Post updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setEditingPost(null);
        setIsCreatingPost(false);
        fetchPosts();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save post');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Make sure you are logged in.');
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: number) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setDeleting(id);
    setError(null);

    try {
      const res = await fetch(`/api/blog-posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess('Post deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchPosts();
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (err) {
      setError('Failed to delete. Make sure you are logged in.');
    } finally {
      setDeleting(null);
    }
  }

  async function uploadPostImage(file: File) {
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name);

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        setEditingPost(prev => prev ? {
          ...prev,
          featuredImage: {
            id: data.id,
            url: data.url,
            filename: data.filename,
          },
        } : null);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError('Failed to upload image. Make sure you are logged in.');
    } finally {
      setUploadingImage(false);
    }
  }

  // Author functions
  function startCreatingAuthor() {
    setEditingAuthor({ ...emptyAuthor });
    setIsCreatingAuthor(true);
  }

  function startEditingAuthor(author: Author) {
    setEditingAuthor({
      id: author.id,
      name: author.name,
      email: author.email || '',
      phone: author.phone || '',
      nmlsId: author.nmlsId || '',
      bio: author.bio || '',
      photoId: author.photoId,
      photoUrl: author.photoUrl,
      isActive: author.isActive,
    });
    setIsCreatingAuthor(false);
  }

  function cancelEditingAuthor() {
    setEditingAuthor(null);
    setIsCreatingAuthor(false);
    setError(null);
  }

  async function saveAuthor() {
    if (!editingAuthor) return;
    if (!editingAuthor.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: editingAuthor.name,
        email: editingAuthor.email || null,
        phone: editingAuthor.phone || null,
        nmlsId: editingAuthor.nmlsId || null,
        bio: editingAuthor.bio || null,
        photoId: editingAuthor.photoId || null,
        isActive: editingAuthor.isActive,
      };

      const url = isCreatingAuthor
        ? '/api/authors'
        : `/api/authors/${editingAuthor.id}`;

      const res = await fetch(url, {
        method: isCreatingAuthor ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(isCreatingAuthor ? 'Author created successfully!' : 'Author updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setEditingAuthor(null);
        setIsCreatingAuthor(false);
        fetchAuthors();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save author');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Make sure you are logged in.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAuthor(id: number) {
    if (!confirm('Are you sure you want to delete this author? Posts by this author will have their author unset.')) return;

    setDeleting(id);
    setError(null);

    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess('Author deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchAuthors();
      } else {
        throw new Error('Failed to delete author');
      }
    } catch (err) {
      setError('Failed to delete. Make sure you are logged in.');
    } finally {
      setDeleting(null);
    }
  }

  async function uploadAuthorImage(file: File) {
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name);

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        setEditingAuthor(prev => prev ? {
          ...prev,
          photoId: data.id,
          photoUrl: data.url,
        } : null);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError('Failed to upload image. Make sure you are logged in.');
    } finally {
      setUploadingImage(false);
    }
  }

  // Loading state
  if (loadingPosts || loadingAuthors) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Edit Post Form
  if (editingPost) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isCreatingPost ? 'New Blog Post' : 'Edit Blog Post'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cancelEditingPost}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={savePost}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
                  {isCreatingPost ? 'Create Post' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={editingPost.title}
              onChange={(e) => {
                const title = e.target.value;
                setEditingPost(prev => prev ? {
                  ...prev,
                  title,
                  slug: prev.slug || generateSlug(title),
                } : null);
              }}
              placeholder="Enter post title"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Slug
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-2">/learn/</span>
              <input
                type="text"
                value={editingPost.slug}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, slug: e.target.value } : null)}
                placeholder="post-url-slug"
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Author Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author
            </label>
            <select
              value={editingPost.authorId || ''}
              onChange={(e) => setEditingPost(prev => prev ? { ...prev, authorId: e.target.value ? parseInt(e.target.value) : null } : null)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="">No author selected</option>
              {authors.filter(a => a.isActive).map(author => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </select>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Featured Image
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              {editingPost.featuredImage?.url ? (
                <div className="flex items-center gap-4">
                  <img
                    src={editingPost.featuredImage.url.startsWith('/') ? editingPost.featuredImage.url : `/${editingPost.featuredImage.url}`}
                    alt="Featured"
                    className="w-32 h-20 object-cover rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => postImageInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => setEditingPost(prev => prev ? { ...prev, featuredImage: undefined } : null)}
                      className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => postImageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {uploadingImage ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Click to upload featured image
                    </div>
                  )}
                </button>
              )}
            </div>
            <input
              ref={postImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPostImage(file);
              }}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excerpt
            </label>
            <textarea
              value={editingPost.excerpt}
              onChange={(e) => setEditingPost(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
              placeholder="Brief description for previews and SEO"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={editingPost.content}
              onChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.target.value } : null)}
              placeholder="Write your blog post content here... (Supports basic formatting)"
              rows={15}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Tip: You can use basic HTML tags for formatting.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={editingPost.status === 'draft'}
                  onChange={() => setEditingPost(prev => prev ? { ...prev, status: 'draft' } : null)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Draft</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={editingPost.status === 'published'}
                  onChange={() => setEditingPost(prev => prev ? { ...prev, status: 'published' } : null)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Published</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit Author Form
  if (editingAuthor) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isCreatingAuthor ? 'New Author' : 'Edit Author'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cancelEditingAuthor}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={saveAuthor}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
                  {isCreatingAuthor ? 'Create Author' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {editingAuthor.photoUrl ? (
                <>
                  <img
                    src={editingAuthor.photoUrl.startsWith('/') ? editingAuthor.photoUrl : `/${editingAuthor.photoUrl}`}
                    alt="Author"
                    className="w-20 h-20 object-cover rounded-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => authorImageInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => setEditingAuthor(prev => prev ? { ...prev, photoId: null, photoUrl: null } : null)}
                      className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => authorImageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <input
              ref={authorImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAuthorImage(file);
              }}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={editingAuthor.name}
              onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Author name"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* NMLS ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              NMLS ID
            </label>
            <input
              type="text"
              value={editingAuthor.nmlsId}
              onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, nmlsId: e.target.value } : null)}
              placeholder="e.g., 123456"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={editingAuthor.email}
              onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, email: e.target.value } : null)}
              placeholder="author@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="text"
              value={editingAuthor.phone}
              onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, phone: e.target.value } : null)}
              placeholder="(555) 555-5555"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={editingAuthor.bio}
              onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, bio: e.target.value } : null)}
              placeholder="Brief biography"
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            />
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingAuthor.isActive}
                onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Active (can be assigned to posts)</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Main List View with Tabs
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your blog posts and authors.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('authors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'authors'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Authors ({authors.length})
          </button>
        </nav>
      </div>

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

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={startCreatingPost}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No blog posts yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first blog post.</p>
              <button
                onClick={startCreatingPost}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Create Post
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {post.featuredImage?.url ? (
                            <img
                              src={post.featuredImage.url.startsWith('/') ? post.featuredImage.url : `/${post.featuredImage.url}`}
                              alt=""
                              className="w-16 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">/learn/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {post.authorRef ? (
                          <div className="flex items-center gap-2">
                            {post.authorRef.photoUrl && (
                              <img
                                src={post.authorRef.photoUrl.startsWith('/') ? post.authorRef.photoUrl : `/${post.authorRef.photoUrl}`}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">{post.authorRef.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No author</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          post.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {post.status === 'draft' ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(post.publishedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/learn/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="View"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => startEditingPost(post)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            disabled={deleting === post.id}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === post.id ? (
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

      {/* Authors Tab */}
      {activeTab === 'authors' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={startCreatingAuthor}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Author
            </button>
          </div>

          {authors.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No authors yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Add authors to attribute blog posts.</p>
              <button
                onClick={startCreatingAuthor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add Author
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {authors.map((author) => (
                <div
                  key={author.id}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4"
                >
                  <div className="flex items-start gap-4">
                    {author.photoUrl ? (
                      <img
                        src={author.photoUrl.startsWith('/') ? author.photoUrl : `/${author.photoUrl}`}
                        alt={author.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xl font-medium">
                        {author.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{author.name}</h3>
                      {author.nmlsId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">NMLS ID #{author.nmlsId}</p>
                      )}
                      {author.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{author.email}</p>
                      )}
                      {author.phone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{author.phone}</p>
                      )}
                      <span className={`inline-flex mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                        author.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {author.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => startEditingAuthor(author)}
                      className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAuthor(author.id)}
                      disabled={deleting === author.id}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                    >
                      {deleting === author.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
