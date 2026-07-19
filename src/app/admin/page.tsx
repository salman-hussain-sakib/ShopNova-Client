'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, User, Product } from '@/lib/api';
import {
  ShieldAlert, Users, Package, DollarSign, Activity, Loader2,
  Trash2, ArrowUpCircle, ArrowDownCircle, Pencil, Eye, EyeOff, X,
  ImagePlus, Save, AlertTriangle, UserCircle, Camera,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalSessions: number;
  totalRevenue: string;
}

interface AdminProduct extends Omit<Product, 'description' | 'shortDescription' | 'brand' | 'stock' | 'images'> {
  hidden?: boolean;
  description?: string;
  shortDescription?: string;
  brand?: string;
  stock?: number;
  images?: string[];
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

const mockChartData = [
  { name: 'Mon', revenue: 4000, visitors: 2400 },
  { name: 'Tue', revenue: 3000, visitors: 1398 },
  { name: 'Wed', revenue: 2000, visitors: 9800 },
  { name: 'Thu', revenue: 2780, visitors: 3908 },
  { name: 'Fri', revenue: 1890, visitors: 4800 },
  { name: 'Sat', revenue: 2390, visitors: 3800 },
  { name: 'Sun', revenue: 3490, visitors: 4300 },
];

export default function AdminDashboard() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'profile'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Admin profile state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/');
      else if (user.role !== 'admin') router.push('/profile');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await api<AdminStats>('/admin/stats');
        setStats(data);
      } else if (activeTab === 'users') {
        const { users } = await api<{ users: User[] }>('/admin/users');
        setUsers(users);
      } else if (activeTab === 'products') {
        const { products } = await api<{ products: AdminProduct[] }>('/admin/products');
        setProducts(products);
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setDataLoading(false);
    }
  };

  const promoteUser = async (id: string, role: string) => {
    try {
      await api(`/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: role === 'admin' ? 'user' : 'admin' }),
      });
      fetchData();
    } catch {
      alert('Failed to update user role');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch {
      alert('Failed to delete user');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch {
      alert('Failed to delete product');
    }
  };

  const toggleVisibility = async (id: string) => {
    try {
      const { hidden } = await api<{ hidden: boolean }>(`/products/${id}/visibility`, {
        method: 'PATCH',
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, hidden } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle product visibility');
    }
  };

  const openEdit = (p: AdminProduct) => {
    setEditingProduct(p);
    setEditError('');
    setEditForm({
      name: p.name,
      price: String(p.price),
      compareAtPrice: String(p.compareAtPrice || ''),
      category: p.category,
      brand: p.brand || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      stock: String(p.stock ?? ''),
      images: p.images ? [...p.images] : [],
    });
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setEditForm(null);
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editingProduct || !editForm) return;
    setEditLoading(true);
    setEditError('');
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
      closeEdit();
      fetchData();
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

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-neutral font-medium">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-secondary" />
              Admin Dashboard
            </h1>
            <p className="text-neutral mt-2">Manage users, products, and view analytics.</p>
          </div>
          <div className="flex bg-neutral/10 p-1 rounded-xl w-fit flex-wrap gap-1">
            {(['overview', 'users', 'products', 'profile'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow'
                    : 'text-neutral hover:text-[var(--foreground)]'
                }`}
              >
                {tab === 'profile' ? 'My Profile' : tab}
              </button>
            ))}
          </div>
        </div>

        {dataLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Revenue', value: stats.totalRevenue, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Active Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Chat Sessions', value: stats.totalSessions, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card p-6 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral">{label}</p>
                        <p className="text-2xl font-bold text-[var(--foreground)] mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card p-6">
                  <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Revenue & Traffic</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} />
                        <YAxis stroke="#a3a3a3" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div className="card p-6 animate-fade-in overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-neutral/10 text-neutral text-sm">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map((u) => (
                      <tr key={(u as any)._id || u.id} className="border-b border-neutral/5 last:border-0">
                        <td className="py-4 text-[var(--foreground)] font-medium">{u.name}</td>
                        <td className="py-4 text-neutral">{u.email}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-neutral/10 text-neutral'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 flex justify-end gap-2">
                          <button
                            onClick={() => promoteUser(u.id, u.role)}
                            className="p-1.5 text-neutral hover:text-primary transition-colors cursor-pointer"
                            title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          >
                            {u.role === 'admin' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-1.5 text-neutral hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Products */}
            {activeTab === 'products' && (
              <div className="card p-6 animate-fade-in overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-neutral/10 text-neutral text-sm">
                      <th className="pb-3 font-medium w-16">Image</th>
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {products.map((p) => (
                      <tr
                        key={p._id}
                        className={`border-b border-neutral/5 last:border-0 transition-opacity ${p.hidden ? 'opacity-40' : ''}`}
                      >
                        <td className="py-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral/10 flex items-center justify-center">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-neutral" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-[var(--foreground)] font-medium max-w-[200px] truncate">{p.name}</td>
                        <td className="py-3 text-neutral">${p.price}</td>
                        <td className="py-3 text-neutral capitalize">{p.category}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.hidden
                              ? 'bg-neutral/10 text-neutral'
                              : 'bg-green-500/10 text-green-600 dark:text-green-400'
                          }`}>
                            {p.hidden ? 'Hidden' : 'Visible'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-1">
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
                              onClick={() => toggleVisibility(p._id)}
                              className={`p-2 rounded-lg transition-all cursor-pointer ${
                                p.hidden
                                  ? 'text-neutral hover:text-green-500 hover:bg-green-500/10'
                                  : 'text-neutral hover:text-orange-500 hover:bg-orange-500/10'
                              }`}
                              title={p.hidden ? 'Make Visible' : 'Hide from Store'}
                            >
                              {p.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => deleteProduct(p._id)}
                              className="p-2 text-neutral hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── My Profile Tab ─── */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl animate-fade-in">
                <div className="card p-6 md:p-8">
                  <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
                    <UserCircle className="w-6 h-6 text-primary" />
                    Admin Profile Settings
                  </h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral/10">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0 group cursor-pointer"
                      onClick={() => document.getElementById('admin-avatar-upload')?.click()}
                    >
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Admin avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer"
                          onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserCircle className="w-12 h-12 text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <input
                        type="file"
                        id="admin-avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setProfileAvatar(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)] text-lg">{user.name}</p>
                      <p className="text-neutral text-sm">{user.email}</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral">Full Name</label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="input-field"
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral">Email Address</label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-neutral">Phone Number</label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="input-field"
                        placeholder="e.g. +880 1700 000000"
                      />
                    </div>

                    {profileMsg && (
                      <p className={`text-sm font-medium ${profileMsg.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                        {profileMsg}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={async () => {
                          setProfileSaving(true);
                          setProfileMsg('');
                          try {
                            await updateProfile({
                              name: profileName,
                              email: profileEmail,
                              phone: profilePhone,
                              avatar: profileAvatar,
                            });
                            setProfileMsg('✓ Profile updated successfully!');
                          } catch {
                            setProfileMsg('Failed to update profile. Try again.');
                          } finally {
                            setProfileSaving(false);
                          }
                        }}
                        disabled={profileSaving}
                        className="btn-primary flex items-center gap-2 cursor-pointer"
                      >
                        {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {profileSaving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Edit Product Modal ─── */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeEdit}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-6 md:p-8 shadow-2xl">
            {/* Header */}
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
                  placeholder="Product name"
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
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral">Compare Price ($)</label>
                  <input
                    type="number"
                    value={editForm.compareAtPrice}
                    onChange={(e) => setEditForm({ ...editForm, compareAtPrice: e.target.value })}
                    className="input-field"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
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

              {/* Short Description */}
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

              {/* Description */}
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

              {/* Error */}
              {editError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-500">{editError}</p>
                </div>
              )}

              {/* Actions */}
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
                  {editLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
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
