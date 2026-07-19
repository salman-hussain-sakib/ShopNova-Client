'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api, Product } from '@/lib/api';
import {
  Trash2, ExternalLink, Plus, Pencil, Eye, EyeOff,
  X, Save, Loader2, ImagePlus, AlertTriangle, Package,
} from 'lucide-react';

interface ManagedProduct extends Omit<Product, 'description' | 'shortDescription' | 'brand' | 'stock' | 'images'> {
  hidden?: boolean;
  description?: string;
  shortDescription?: string;
  brand?: string;
  stock?: number;
  images?: string[];
  compareAtPrice?: number;
}

interface EditForm {
  name: string;
  price: string;
  compareAtPrice: string;
  category: string;
  brand: string;
  shortDescription: string;
  description: string;
  stock: string;
  images: string[];
}

export default function ManageItemsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit modal
  const [editingProduct, setEditingProduct] = useState<ManagedProduct | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api<{ products: ManagedProduct[] }>('/products/manage/mine'),
    enabled: !!user,
  });

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    setDeleting(id);
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  // ── Hide / Show ─────────────────────────────────────────
  const handleToggleVisibility = async (p: ManagedProduct) => {
    setTogglingId(p._id);
    try {
      await api(`/products/${p._id}/visibility`, { method: 'PATCH' });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle visibility');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Edit ────────────────────────────────────────────────
  const openEdit = (p: ManagedProduct) => {
    setEditingProduct(p);
    setEditError('');
    setEditSuccess('');
    setEditForm({
      name: p.name,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      category: p.category,
      brand: p.brand || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      stock: p.stock !== undefined ? String(p.stock) : '',
      images: p.images ? [...p.images] : [],
    });
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setEditForm(null);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSave = async () => {
    if (!editingProduct || !editForm) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      await api(`/products/${editingProduct._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          price: editForm.price,
          compareAtPrice: editForm.compareAtPrice || undefined,
          category: editForm.category,
          brand: editForm.brand,
          description: editForm.description,
          shortDescription: editForm.shortDescription,
          stock: editForm.stock,
          images: editForm.images,
        }),
      });
      setEditSuccess('Product updated successfully!');
      refetch();
      setTimeout(closeEdit, 1200);
    } catch {
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const addImageUrl = () => {
    const url = window.prompt('Enter image URL:');
    if (url && editForm) {
      setEditForm({ ...editForm, images: [...editForm.images, url] });
    }
  };

  const removeImage = (idx: number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, images: editForm.images.filter((_, i) => i !== idx) });
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center gap-3 text-neutral">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Manage Products</h1>
          <p className="text-neutral mt-1">Edit, hide, or delete your listed products.</p>
        </div>
        <Link href="/items/add" className="btn-primary flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !data?.products?.length ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-neutral mx-auto mb-4" />
          <p className="text-neutral mb-4">You haven&apos;t listed any products yet.</p>
          <Link href="/items/add" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral/10 bg-neutral/5">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral w-14">Img</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral hidden md:table-cell">Stock</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-neutral">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.products?.map((p) => (
                  <tr
                    key={p._id}
                    className={`border-b border-neutral/5 hover:bg-neutral/5 transition-colors ${p.hidden ? 'opacity-50' : ''}`}
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral/10 flex items-center justify-center flex-shrink-0">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-neutral" />
                        )}
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--foreground)] text-sm line-clamp-1">{p.name}</span>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 text-sm text-neutral hidden sm:table-cell capitalize">{p.category}</td>
                    {/* Price */}
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">${p.price.toFixed(2)}</td>
                    {/* Stock */}
                    <td className="px-4 py-3 text-sm text-neutral hidden md:table-cell">{p.stock ?? '–'}</td>
                    {/* Status */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.hidden
                          ? 'bg-neutral/10 text-neutral'
                          : 'bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}>
                        {p.hidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Link
                          href={`/products/${p.slug}`}
                          className="p-2 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="View Product"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-neutral hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Hide / Show */}
                        <button
                          onClick={() => handleToggleVisibility(p)}
                          disabled={togglingId === p._id}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            p.hidden
                              ? 'text-neutral hover:text-green-500 hover:bg-green-500/10'
                              : 'text-neutral hover:text-orange-500 hover:bg-orange-500/10'
                          }`}
                          title={p.hidden ? 'Make Visible' : 'Hide from Store'}
                        >
                          {togglingId === p._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : p.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
                          }
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(p._id)}
                          disabled={deleting === p._id}
                          className="p-2 text-neutral hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                          title="Delete Product"
                        >
                          {deleting === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Edit Product Modal ─── */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />

          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-6 md:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" />
                Edit Product
              </h2>
              <button onClick={closeEdit} className="p-2 hover:bg-neutral/10 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-neutral" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Price + Compare */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral">Price ($)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="input-field"
                    min="0" step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral">Compare Price ($)</label>
                  <input
                    type="number"
                    value={editForm.compareAtPrice}
                    onChange={(e) => setEditForm({ ...editForm, compareAtPrice: e.target.value })}
                    className="input-field"
                    min="0" step="0.01" placeholder="Optional"
                  />
                </div>
              </div>

              {/* Category + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral">Brand</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral">Stock</label>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="input-field"
                  min="0"
                />
              </div>

              {/* Short Desc */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral">Short Description</label>
                <input
                  type="text"
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  className="input-field"
                  placeholder="Brief tagline"
                />
              </div>

              {/* Full Desc */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral">Full Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field min-h-[100px] resize-y"
                  placeholder="Full product description"
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral">Product Images</label>
                <div className="flex flex-wrap gap-3">
                  {editForm.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral/20 group">
                      <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addImageUrl}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral/30 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-neutral hover:text-primary transition-all cursor-pointer"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px]">Add URL</span>
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              {editError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-500">{editError}</p>
                </div>
              )}
              {editSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">{editSuccess}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-neutral/20 rounded-xl hover:bg-neutral/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
