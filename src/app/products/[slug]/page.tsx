'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { api, API_URL, Product, Review, trackBehavior, getSessionId } from '@/lib/api';
import { fallbackProducts } from '@/data/products';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { Star, Check, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cart';
import Product3DViewer from '@/components/Product3DViewer';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () =>
      api<{ product: Product; reviews: Review[]; related: Product[] }>(`/products/${slug}`),
    retry: 1,
  });

  // AI-powered recommendations
  const { data: recoData } = useQuery({
    queryKey: ['recommendations', slug],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_URL}/ai/recommendations?sessionId=${getSessionId()}&limit=4`,
          { headers: { Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' } }
        );
        if (!res.ok) throw new Error('API error');
        return res.json() as Promise<{ products: Product[]; reasoning: string }>;
      } catch {
        // Graceful fallback: show top-rated products excluding current slug
        const picks = fallbackProducts
          .filter((p) => p.slug !== slug)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4);
        return { products: picks as unknown as Product[], reasoning: 'Our top-rated picks across popular categories, curated just for you.' };
      }
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data?.product) {
      trackBehavior(data.product._id, 'view', data.product.category);
    }
  }, [data?.product]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 skeleton rounded" />
            <div className="h-6 w-1/4 skeleton rounded" />
            <div className="h-20 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-dark">Product not found</h1>
        <p className="text-neutral mt-2 text-sm">This product may have been removed or the link is incorrect.</p>
        <Link href="/products" className="text-primary mt-4 inline-block">Back to products</Link>
      </div>
    );
  }

  const { product, reviews, related } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/products" className="inline-flex items-center gap-1 text-neutral hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden card">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 25vw"
              />
            </div>
            
            <div className="relative aspect-square rounded-2xl overflow-hidden card bg-gradient-to-b from-neutral-light/20 to-transparent flex flex-col items-center justify-center p-4">
              <div className="absolute top-4 left-4 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider select-none pointer-events-none z-20">
                3D Interactive Hologram
              </div>
              
              <Product3DViewer
                category={product.category}
                fallbackImage={product.images[0]}
                autoRotate={true}
                interactive={true}
              />

              <div className="absolute bottom-4 text-[10px] text-neutral select-none pointer-events-none z-20">
                Drag to rotate • Scroll to zoom
              </div>
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <div key={`${product._id}-${i}`} className="relative aspect-square rounded-xl overflow-hidden card">
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-neutral uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-3xl font-bold text-neutral-dark mt-1 mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(product.rating) ? 'fill-accent text-accent' : 'text-neutral/30'}`}
                />
              ))}
            </div>
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-neutral text-sm">({product.reviewCount} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-neutral-dark">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-neutral line-through">${product.compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          <p className="text-neutral leading-relaxed mb-6">{product.shortDescription}</p>

          <div className="flex items-center gap-2 mb-6 text-sm">
            {product.stock > 0 ? (
              <span className="flex items-center gap-1 text-secondary"><Check className="w-4 h-4" /> In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </div>

          <button
            onClick={() => {
              addToCart(product);
              trackBehavior(product._id, 'add_to_cart', product.category);
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
            className={`btn-primary flex items-center gap-2 w-full sm:w-auto justify-center transition-all ${
              added ? 'bg-secondary hover:bg-secondary/90 shadow-secondary/20' : ''
            }`}
          >
            {added ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            {added ? 'Added to Cart!' : 'Add to Cart'}
          </button>

          <div className="mt-8">
            <h3 className="font-semibold text-neutral-dark mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10 mb-16">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-neutral-dark mb-4">Description</h2>
          <p className="text-neutral leading-relaxed">{product.description}</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark mb-4">Specifications</h2>
          <div className="card divide-y divide-neutral/10">
            {Object.entries(product.specs).map(([key, val]) => (
              <div key={key} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-neutral">{key}</span>
                <span className="font-medium text-neutral-dark">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neutral-dark mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-neutral">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-dark">{r.userName}</span>
                    {r.verified && (
                      <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">Verified</span>
                    )}
                  </div>
                  <div className="flex">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
                <h4 className="font-medium text-neutral-dark mb-1">{r.title}</h4>
                <p className="text-neutral text-sm leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      {recoData && recoData.products.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              You Might Also Like
            </h2>
          </div>
          {recoData.reasoning && (
            <p className="text-sm text-neutral mb-6 max-w-2xl italic">✨ {recoData.reasoning}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recoData.products.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-neutral-dark mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
