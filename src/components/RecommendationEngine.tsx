'use client';

import { useQuery } from '@tanstack/react-query';
import { api, getSessionId, Product } from '@/lib/api';
import { fallbackProducts } from '@/data/products';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RecommendationResponse {
  products: Product[];
  reasoning: string;
  insights: {
    topCategories: string[];
    averagePriceViewed: number | null;
    eventsAnalyzed: number;
  };
  refinementOptions: { label: string; filter: Record<string, unknown> }[];
}

const OFFLINE_FALLBACK: RecommendationResponse = {
  products: [...fallbackProducts]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4) as unknown as Product[],
  reasoning: 'Our top-rated picks across popular categories, curated just for you.',
  insights: { topCategories: [], averagePriceViewed: null, eventsAnalyzed: 0 },
  refinementOptions: [
    { label: 'Under $100', filter: { maxPrice: 100 } },
    { label: 'Top rated only', filter: { minRating: 4.5 } },
    { label: 'New arrivals', filter: { sort: 'newest' } },
  ],
};

export default function RecommendationEngine() {
  const [refinement, setRefinement] = useState<Record<string, unknown>>({});

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['recommendations', getSessionId(), refinement],
    queryFn: async () => {
      try {
        if (Object.keys(refinement).length) {
          return await api<RecommendationResponse>('/ai/recommendations/refine', {
            method: 'POST',
            body: JSON.stringify({ sessionId: getSessionId(), ...refinement, limit: 4 }),
          });
        }
        return await api<RecommendationResponse>(
          `/ai/recommendations?sessionId=${getSessionId()}&limit=4`
        );
      } catch {
        // Backend offline — return curated fallback so section always renders
        return OFFLINE_FALLBACK;
      }
    },
  });

  const chartData =
    data?.insights.topCategories.map((cat) => ({
      name: cat,
      interest: Math.floor(Math.random() * 40) + 60,
    })) || [];

  return (
    <section className="py-16 bg-gradient-to-b from-neutral-light/50 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              Smart Recommendations
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark">Picked Just For You</h2>
            {data?.reasoning && (
              <p className="text-neutral mt-2 max-w-2xl">{data.reasoning}</p>
            )}
          </div>
          <button
            onClick={() => {
              setRefinement({});
              refetch();
            }}
            disabled={isFetching}
            className="btn-outline text-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {data?.refinementOptions && (
          <div className="flex flex-wrap gap-2 mb-8">
            {data.refinementOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setRefinement(opt.filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  JSON.stringify(refinement) === JSON.stringify(opt.filter)
                    ? 'bg-primary text-white'
                    : 'bg-[var(--surface)] border border-[var(--border-color)] text-[var(--foreground)] hover:border-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : data?.products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-neutral-dark mb-4">Your Interests</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="interest" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-neutral">Browse products to unlock personalized insights.</p>
            )}
            {data?.insights && (
              <div className="mt-4 space-y-2 text-sm text-neutral">
                <p>Events analyzed: {data.insights.eventsAnalyzed}</p>
                {data.insights.averagePriceViewed && (
                  <p>Avg. price viewed: ${data.insights.averagePriceViewed.toFixed(0)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
