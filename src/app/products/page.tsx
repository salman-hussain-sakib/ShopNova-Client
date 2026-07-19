'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api, Product, Pagination, trackSearch } from '@/lib/api';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Track search queries so the AI remembers what the user has searched for
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      trackSearch(debouncedSearch.trim());
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
  }, [searchParams]);

  const { data: meta } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ categories: string[]; brands: string[] }>('/products/categories'),
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', debouncedSearch, category, brand, sort, minPrice, maxPrice],
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: '12',
        sort,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      return api<{ products: Product[]; pagination: Pagination }>(`/products?${params}`);
    },
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const products = data?.pages.flatMap((p) => p.products) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-dark mb-2">All Products</h1>
        <p className="text-neutral">Browse our curated collection of quality products.</p>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--surface-strong)',
              color: 'var(--foreground)',
              border: '1.5px solid var(--border-color)',
            }}
            className="w-full pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm placeholder:text-neutral"
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            background: 'var(--surface-strong)',
            color: 'var(--foreground)',
            border: '1.5px solid var(--border-color)',
          }}
          className="sm:w-52 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="popular">Most Popular</option>
        </select>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: showFilters ? 'var(--primary)' : 'var(--surface-strong)',
            color: showFilters ? '#fff' : 'var(--foreground)',
            border: '1.5px solid var(--border-color)',
          }}
          className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex gap-8">
        <aside className={`lg:w-64 flex-shrink-0 space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div>
            <label className="text-sm font-semibold text-neutral-dark mb-2 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ background: 'var(--surface-strong)', color: 'var(--foreground)', border: '1.5px solid var(--border-color)' }}
              className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Categories</option>
              {meta?.categories?.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-dark mb-2 block">Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              style={{ background: 'var(--surface-strong)', color: 'var(--foreground)', border: '1.5px solid var(--border-color)' }}
              className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Brands</option>
              {meta?.brands?.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-dark mb-2 block">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ background: 'var(--surface-strong)', color: 'var(--foreground)', border: '1.5px solid var(--border-color)' }}
                className="w-full px-3 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm placeholder:text-neutral"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ background: 'var(--surface-strong)', color: 'var(--foreground)', border: '1.5px solid var(--border-color)' }}
                className="w-full px-3 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-sm placeholder:text-neutral"
              />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-neutral">
              <p className="text-lg">No products found.</p>
              <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
              {hasNextPage && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn-outline disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
