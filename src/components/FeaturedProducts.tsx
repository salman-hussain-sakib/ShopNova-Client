'use client';

import { useQuery } from '@tanstack/react-query';
import { api, Product } from '@/lib/api';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: () => api<{ products: Product[] }>('/products/featured'),
  });

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-neutral-dark">Featured Products</h2>
          <Link href="/products" className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.products.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}
