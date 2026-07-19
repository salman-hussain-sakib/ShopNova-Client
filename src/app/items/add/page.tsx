'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function AddItemPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    brand: '',
    stock: '',
    tags: '',
    imageUrl: '',
    specs: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-neutral">Loading...</div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const specsObj: Record<string, string> = {};
      form.specs.split('\n').forEach((line) => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) specsObj[key.trim()] = rest.join(':').trim();
      });

      await api('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          shortDescription: form.shortDescription,
          description: form.description,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          category: form.category,
          brand: form.brand,
          stock: parseInt(form.stock, 10),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          images: form.imageUrl ? [form.imageUrl] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
          specs: specsObj,
        }),
      });

      setSuccess('Product created successfully!');
      setForm({
        name: '', shortDescription: '', description: '', price: '', compareAtPrice: '',
        category: '', brand: '', stock: '', tags: '', imageUrl: '', specs: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-neutral-dark mb-2">Add New Product</h1>
      <p className="text-neutral mb-8">List a new item in the ShopNova catalog.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="text-sm font-medium mb-1 block">Product Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Short Description *</label>
          <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input-field" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Full Description *</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[100px]" required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Price ($) *</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Compare At Price ($)</label>
            <input type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className="input-field" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Category *</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" required placeholder="e.g. Audio" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Brand *</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" required />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Stock *</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="wireless, premium" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Image URL</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Specs (one per line, Key: Value)</label>
          <textarea value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} className="input-field min-h-[80px]" placeholder="Weight: 250g&#10;Color: Black" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-secondary text-sm">{success}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
