'use client';

import { useState, useEffect } from 'react';

interface LoanProduct {
  id: number;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  icon_name: string | null;
  highlights: string[] | null;
  best_for: string | null;
  down_payment: string | null;
  credit_score: string | null;
  display_order: number | null;
  is_active: boolean | null;
  primary_button_text: string | null;
  primary_button_link: string | null;
  primary_button_style: string | null;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
  secondary_button_style: string | null;
  show_secondary_button: boolean | null;
  // Article page fields
  hero_image: string | null;
  article_intro: string | null;
  article_sections: { title: string; content: string }[] | null;
  article_requirements: string[] | null;
  article_faqs: { q: string; a: string }[] | null;
}

interface Widget {
  id: number;
  widget_type: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  icon_name: string | null;
  icon_color: string | null;
  partner_name: string | null;
  partner_company: string | null;
  partner_email: string | null;
  partner_phone: string | null;
  display_order: number | null;
  show_on_mobile: boolean | null;
  show_on_desktop: boolean | null;
  is_active: boolean | null;
}

interface PageSettings {
  hero_title: string | null;
  hero_description: string | null;
  show_jump_pills: boolean | null;
  bottom_cta_title: string | null;
  bottom_cta_description: string | null;
}

const iconOptions = [
  { value: 'home', label: 'Home' },
  { value: 'shield', label: 'Shield' },
  { value: 'star', label: 'Star' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'currency', label: 'Currency' },
  { value: 'refresh', label: 'Refresh' },
  { value: 'chart', label: 'Chart' },
  { value: 'calculator', label: 'Calculator' },
  { value: 'user', label: 'User' },
];

const widgetTypeOptions = [
  { value: 'home_value', label: 'Home Value Estimator' },
  { value: 'calculator', label: 'Payment Calculator' },
  { value: 'featured_partner', label: 'Featured Partner' },
  { value: 'custom', label: 'Custom Widget' },
];

export default function LoanProgramsAdminPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'articles' | 'widgets' | 'settings'>('products');
  const [articleEditProduct, setArticleEditProduct] = useState<LoanProduct | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [settings, setSettings] = useState<PageSettings>({
    hero_title: 'Loan Programs',
    hero_description: '',
    show_jump_pills: true,
    bottom_cta_title: '',
    bottom_cta_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, widgetsRes, settingsRes] = await Promise.all([
        fetch('/api/loan-products'),
        fetch('/api/loan-page-widgets'),
        fetch('/api/loan-page-settings'),
      ]);

      const productsData = await productsRes.json();
      const widgetsData = await widgetsRes.json();
      const settingsData = await settingsRes.json();

      if (productsData.success) setProducts(productsData.data);
      if (widgetsData.success) setWidgets(widgetsData.data);
      if (settingsData.success) setSettings(settingsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // Product handlers
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const isNew = !editingProduct.id;
      const res = await fetch('/api/loan-products', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json();
      if (data.success) {
        await fetchData();
        setShowProductModal(false);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this loan product?')) return;

    try {
      const res = await fetch(`/api/loan-products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleReorderProducts = async (newOrder: LoanProduct[]) => {
    setProducts(newOrder);
    try {
      await fetch('/api/loan-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          items: newOrder.map((p, i) => ({ id: p.id, display_order: i + 1 })),
        }),
      });
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  // Widget handlers
  const handleSaveWidget = async () => {
    if (!editingWidget) return;
    setSaving(true);

    try {
      const isNew = !editingWidget.id;
      const res = await fetch('/api/loan-page-widgets', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingWidget),
      });

      const data = await res.json();
      if (data.success) {
        await fetchData();
        setShowWidgetModal(false);
        setEditingWidget(null);
      }
    } catch (error) {
      console.error('Error saving widget:', error);
    }
    setSaving(false);
  };

  const handleDeleteWidget = async (id: number) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;

    try {
      const res = await fetch(`/api/loan-page-widgets?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  };

  const handleReorderWidgets = async (newOrder: Widget[]) => {
    setWidgets(newOrder);
    try {
      await fetch('/api/loan-page-widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          items: newOrder.map((w, i) => ({ id: w.id, display_order: i + 1 })),
        }),
      });
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  // Settings handler
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/loan-page-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings saved!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    setSaving(false);
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    if (activeTab === 'products') {
      const newItems = [...products];
      const draggedProduct = newItems[draggedItem];
      newItems.splice(draggedItem, 1);
      newItems.splice(index, 0, draggedProduct);
      setProducts(newItems);
      setDraggedItem(index);
    } else if (activeTab === 'widgets') {
      const newItems = [...widgets];
      const draggedWidget = newItems[draggedItem];
      newItems.splice(draggedItem, 1);
      newItems.splice(index, 0, draggedWidget);
      setWidgets(newItems);
      setDraggedItem(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedItem !== null) {
      if (activeTab === 'products') {
        handleReorderProducts(products);
      } else if (activeTab === 'widgets') {
        handleReorderWidgets(widgets);
      }
    }
    setDraggedItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loan Programs Page</h1>
        <p className="text-gray-500 text-sm mt-1">Manage loan products, widgets, and page settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['products', 'articles', 'widgets', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-[#181F53] text-[#181F53]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'products' ? 'Loan Products' : tab === 'articles' ? 'Article Content' : tab === 'widgets' ? 'Widgets' : 'Page Settings'}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">Drag to reorder. Click to edit.</p>
            <button
              onClick={() => {
                setEditingProduct({
                  id: 0,
                  name: '',
                  slug: null,
                  tagline: '',
                  description: '',
                  icon_name: 'home',
                  highlights: [],
                  best_for: '',
                  down_payment: '',
                  credit_score: '',
                  display_order: 0,
                  is_active: true,
                  primary_button_text: 'Apply Now',
                  primary_button_link: '/apply',
                  primary_button_style: 'filled',
                  secondary_button_text: 'Call to Learn More',
                  secondary_button_link: 'tel:870-926-4052',
                  secondary_button_style: 'outline',
                  show_secondary_button: true,
                  hero_image: null,
                  article_intro: null,
                  article_sections: null,
                  article_requirements: null,
                  article_faqs: null,
                });
                setShowProductModal(true);
              }}
              className="px-4 py-2 bg-[#181F53] text-white text-sm font-medium rounded-lg hover:bg-[#0f1638]"
            >
              + Add Loan Product
            </button>
          </div>

          <div className="space-y-2">
            {products.map((product, index) => (
              <div
                key={product.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-sm ${
                  draggedItem === index ? 'opacity-50' : ''
                } ${!product.is_active ? 'opacity-60' : ''}`}
              >
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.tagline}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {product.is_active ? 'Active' : 'Inactive'}
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setShowProductModal(true);
                  }}
                  className="px-3 py-1 text-sm text-[#181F53] hover:bg-gray-100 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <div>
          {!articleEditProduct ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Click on a loan product to edit its individual article page content.
              </p>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setArticleEditProduct(product)}
                    className={`flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm hover:border-[#181F53] transition-all ${
                      !product.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    {product.hero_image ? (
                      <img
                        src={product.hero_image}
                        alt={product.name}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        /loans/{product.slug || 'no-slug'}
                        {product.article_intro && (
                          <span className="ml-2 text-green-600">• Has article content</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <button
                    onClick={() => setArticleEditProduct(null)}
                    className="text-sm text-[#181F53] hover:underline mb-2 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to list
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">{articleEditProduct.name} - Article Content</h2>
                  <p className="text-sm text-gray-500">Edit the individual loan page at /loans/{articleEditProduct.slug}</p>
                </div>
                <a
                  href={`/loans/${articleEditProduct.slug}`}
                  target="_blank"
                  className="px-4 py-2 text-sm text-[#181F53] border border-[#181F53] rounded-lg hover:bg-gray-50"
                >
                  View Page
                </a>
              </div>

              <div className="space-y-6">
                {/* Hero Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                  <input
                    type="text"
                    value={articleEditProduct.hero_image || ''}
                    onChange={(e) => setArticleEditProduct({ ...articleEditProduct, hero_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="/images/loan-conventional.jpg"
                  />
                  {articleEditProduct.hero_image && (
                    <img
                      src={articleEditProduct.hero_image}
                      alt="Preview"
                      className="mt-2 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Article Intro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Article Introduction
                    <span className="text-gray-400 font-normal ml-2">(Leave blank to use default)</span>
                  </label>
                  <textarea
                    value={articleEditProduct.article_intro || ''}
                    onChange={(e) => setArticleEditProduct({ ...articleEditProduct, article_intro: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter a custom introduction for this loan type article..."
                  />
                </div>

                {/* Article Sections */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Article Sections
                      <span className="text-gray-400 font-normal ml-2">(Leave blank to use default)</span>
                    </label>
                    <button
                      onClick={() => {
                        const sections = articleEditProduct.article_sections || [];
                        setArticleEditProduct({
                          ...articleEditProduct,
                          article_sections: [...sections, { title: '', content: '' }]
                        });
                      }}
                      className="text-sm text-[#181F53] hover:underline"
                    >
                      + Add Section
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(articleEditProduct.article_sections || []).map((section, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Section {index + 1}</span>
                          <button
                            onClick={() => {
                              const sections = [...(articleEditProduct.article_sections || [])];
                              sections.splice(index, 1);
                              setArticleEditProduct({ ...articleEditProduct, article_sections: sections });
                            }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const sections = [...(articleEditProduct.article_sections || [])];
                            sections[index] = { ...section, title: e.target.value };
                            setArticleEditProduct({ ...articleEditProduct, article_sections: sections });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                          placeholder="Section Title"
                        />
                        <textarea
                          value={section.content}
                          onChange={(e) => {
                            const sections = [...(articleEditProduct.article_sections || [])];
                            sections[index] = { ...section, content: e.target.value };
                            setArticleEditProduct({ ...articleEditProduct, article_sections: sections });
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Section content..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Article Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eligibility Requirements (one per line)
                    <span className="text-gray-400 font-normal ml-2">(Leave blank to use default)</span>
                  </label>
                  <textarea
                    value={(articleEditProduct.article_requirements || []).join('\n')}
                    onChange={(e) => setArticleEditProduct({
                      ...articleEditProduct,
                      article_requirements: e.target.value.split('\n').filter(r => r.trim())
                    })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Minimum credit score of 620&#10;Down payment of 3-20%&#10;Stable employment history"
                  />
                </div>

                {/* Article FAQs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Frequently Asked Questions
                      <span className="text-gray-400 font-normal ml-2">(Leave blank to use default)</span>
                    </label>
                    <button
                      onClick={() => {
                        const faqs = articleEditProduct.article_faqs || [];
                        setArticleEditProduct({
                          ...articleEditProduct,
                          article_faqs: [...faqs, { q: '', a: '' }]
                        });
                      }}
                      className="text-sm text-[#181F53] hover:underline"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(articleEditProduct.article_faqs || []).map((faq, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">FAQ {index + 1}</span>
                          <button
                            onClick={() => {
                              const faqs = [...(articleEditProduct.article_faqs || [])];
                              faqs.splice(index, 1);
                              setArticleEditProduct({ ...articleEditProduct, article_faqs: faqs });
                            }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={(e) => {
                            const faqs = [...(articleEditProduct.article_faqs || [])];
                            faqs[index] = { ...faq, q: e.target.value };
                            setArticleEditProduct({ ...articleEditProduct, article_faqs: faqs });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                          placeholder="Question"
                        />
                        <textarea
                          value={faq.a}
                          onChange={(e) => {
                            const faqs = [...(articleEditProduct.article_faqs || [])];
                            faqs[index] = { ...faq, a: e.target.value };
                            setArticleEditProduct({ ...articleEditProduct, article_faqs: faqs });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Answer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setArticleEditProduct(null)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch('/api/loan-products', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(articleEditProduct),
                        });
                        const data = await res.json();
                        if (data.success) {
                          await fetchData();
                          setArticleEditProduct(null);
                          alert('Article content saved!');
                        }
                      } catch (error) {
                        console.error('Error saving article:', error);
                      }
                      setSaving(false);
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-[#181F53] text-white font-medium rounded-lg hover:bg-[#0f1638] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Article Content'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widgets Tab */}
      {activeTab === 'widgets' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">Drag to reorder. Click to edit.</p>
            <button
              onClick={() => {
                setEditingWidget({
                  id: 0,
                  widget_type: 'custom',
                  title: '',
                  description: '',
                  button_text: '',
                  button_link: '',
                  icon_name: '',
                  icon_color: '#181F53',
                  partner_name: '',
                  partner_company: '',
                  partner_email: '',
                  partner_phone: '',
                  display_order: 0,
                  show_on_mobile: true,
                  show_on_desktop: true,
                  is_active: true,
                });
                setShowWidgetModal(true);
              }}
              className="px-4 py-2 bg-[#181F53] text-white text-sm font-medium rounded-lg hover:bg-[#0f1638]"
            >
              + Add Widget
            </button>
          </div>

          <div className="space-y-2">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-sm ${
                  draggedItem === index ? 'opacity-50' : ''
                } ${!widget.is_active ? 'opacity-60' : ''}`}
              >
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{widget.title}</div>
                  <div className="text-sm text-gray-500">
                    {widgetTypeOptions.find(o => o.value === widget.widget_type)?.label || widget.widget_type}
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  {widget.show_on_mobile && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Mobile</span>
                  )}
                  {widget.show_on_desktop && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Desktop</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingWidget(widget);
                    setShowWidgetModal(true);
                  }}
                  className="px-3 py-1 text-sm text-[#181F53] hover:bg-gray-100 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteWidget(widget.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hero Section</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={settings.hero_title || ''}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={settings.hero_description || ''}
                    onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPills"
                    checked={settings.show_jump_pills || false}
                    onChange={(e) => setSettings({ ...settings, show_jump_pills: e.target.checked })}
                    className="w-4 h-4 text-[#181F53] rounded"
                  />
                  <label htmlFor="showPills" className="text-sm text-gray-700">
                    Show &quot;Jump to Loan Type&quot; pills on mobile
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bottom CTA Section</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={settings.bottom_cta_title || ''}
                    onChange={(e) => setSettings({ ...settings, bottom_cta_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={settings.bottom_cta_description || ''}
                    onChange={(e) => setSettings({ ...settings, bottom_cta_description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-[#181F53] text-white font-medium rounded-lg hover:bg-[#0f1638] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingProduct.id ? 'Edit Loan Product' : 'Add Loan Product'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., FHA Loans"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <select
                      value={editingProduct.icon_name || 'home'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, icon_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editingProduct.tagline || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Great for first-time homebuyers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
                    <input
                      type="text"
                      value={editingProduct.down_payment || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, down_payment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 3.5%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label>
                    <input
                      type="text"
                      value={editingProduct.credit_score || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, credit_score: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 580+"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Best For</label>
                  <input
                    type="text"
                    value={editingProduct.best_for || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, best_for: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., First-time buyers with lower credit scores"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Benefits (one per line)
                  </label>
                  <textarea
                    value={(editingProduct.highlights || []).join('\n')}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      highlights: e.target.value.split('\n').filter(h => h.trim()),
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Only 3.5% down payment&#10;Credit scores as low as 580&#10;Lower closing costs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="productActive"
                    checked={editingProduct.is_active || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#181F53] rounded"
                  />
                  <label htmlFor="productActive" className="text-sm text-gray-700">Active</label>
                </div>

                {/* Buttons Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Card Buttons</h3>

                  {/* Primary Button */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Primary Button</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={editingProduct.primary_button_text || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, primary_button_text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Apply Now"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                        <input
                          type="text"
                          value={editingProduct.primary_button_link || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, primary_button_link: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="/apply"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <select
                        value={editingProduct.primary_button_style || 'filled'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, primary_button_style: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="filled">Filled (Red)</option>
                        <option value="outline">Outline (Navy)</option>
                      </select>
                    </div>
                  </div>

                  {/* Secondary Button */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Secondary Button</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showSecondaryBtn"
                          checked={editingProduct.show_secondary_button ?? true}
                          onChange={(e) => setEditingProduct({ ...editingProduct, show_secondary_button: e.target.checked })}
                          className="w-4 h-4 text-[#181F53] rounded"
                        />
                        <label htmlFor="showSecondaryBtn" className="text-xs text-gray-600">Show</label>
                      </div>
                    </div>
                    {editingProduct.show_secondary_button !== false && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                            <input
                              type="text"
                              value={editingProduct.secondary_button_text || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, secondary_button_text: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Call to Learn More"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                            <input
                              type="text"
                              value={editingProduct.secondary_button_link || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, secondary_button_link: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="tel:870-926-4052"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                          <select
                            value={editingProduct.secondary_button_style || 'outline'}
                            onChange={(e) => setEditingProduct({ ...editingProduct, secondary_button_style: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="filled">Filled (Red)</option>
                            <option value="outline">Outline (Navy)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={saving || !editingProduct.name}
                  className="px-6 py-2 bg-[#181F53] text-white font-medium rounded-lg hover:bg-[#0f1638] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Modal */}
      {showWidgetModal && editingWidget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingWidget.id ? 'Edit Widget' : 'Add Widget'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Widget Type *</label>
                  <select
                    value={editingWidget.widget_type}
                    onChange={(e) => setEditingWidget({ ...editingWidget, widget_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {widgetTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={editingWidget.title}
                    onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {editingWidget.widget_type === 'featured_partner' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                        <input
                          type="text"
                          value={editingWidget.partner_name || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, partner_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input
                          type="text"
                          value={editingWidget.partner_company || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, partner_company: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editingWidget.partner_email || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, partner_email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={editingWidget.partner_phone || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, partner_phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editingWidget.description || ''}
                        onChange={(e) => setEditingWidget({ ...editingWidget, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={editingWidget.button_text || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, button_text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                        <input
                          type="text"
                          value={editingWidget.button_link || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, button_link: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="/home-value"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                        <select
                          value={editingWidget.icon_name || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, icon_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">None</option>
                          {iconOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon Color</label>
                        <input
                          type="color"
                          value={editingWidget.icon_color || '#181F53'}
                          onChange={(e) => setEditingWidget({ ...editingWidget, icon_color: e.target.value })}
                          className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showMobile"
                      checked={editingWidget.show_on_mobile || false}
                      onChange={(e) => setEditingWidget({ ...editingWidget, show_on_mobile: e.target.checked })}
                      className="w-4 h-4 text-[#181F53] rounded"
                    />
                    <label htmlFor="showMobile" className="text-sm text-gray-700">Show on Mobile</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showDesktop"
                      checked={editingWidget.show_on_desktop || false}
                      onChange={(e) => setEditingWidget({ ...editingWidget, show_on_desktop: e.target.checked })}
                      className="w-4 h-4 text-[#181F53] rounded"
                    />
                    <label htmlFor="showDesktop" className="text-sm text-gray-700">Show on Desktop</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="widgetActive"
                      checked={editingWidget.is_active || false}
                      onChange={(e) => setEditingWidget({ ...editingWidget, is_active: e.target.checked })}
                      className="w-4 h-4 text-[#181F53] rounded"
                    />
                    <label htmlFor="widgetActive" className="text-sm text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowWidgetModal(false);
                    setEditingWidget(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWidget}
                  disabled={saving || !editingWidget.title || !editingWidget.widget_type}
                  className="px-6 py-2 bg-[#181F53] text-white font-medium rounded-lg hover:bg-[#0f1638] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
