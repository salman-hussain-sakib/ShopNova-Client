import { fallbackProducts as clientFallbackProducts, fallbackReviews as clientFallbackReviews } from '../data/products';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  brand: string;
  tags: string[];
  images: string[];
  specs: Record<string, string>;
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const isProductList = endpoint === '/products' || endpoint.startsWith('/products?') || endpoint === '/products/featured';
  const isCategories = endpoint === '/products/categories';
  // Slug-based detail page: /products/<slug> but not a list/categories/manage route
  const isProductSlug = isGet &&
    endpoint.startsWith('/products/') &&
    !isProductList &&
    !isCategories &&
    !endpoint.startsWith('/products/manage');

  // Helper: load fallback static product data from the server
  const loadFallbackProducts = async (): Promise<any[] | null> => {
    return clientFallbackProducts;
  };

  // Helper: load fallback reviews from the server
  const loadFallbackReviews = async (): Promise<any[]> => {
    return clientFallbackReviews;
  };

  // Try the primary API endpoint first
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    // For product slug pages: if server returned 404 / not found, try fallback
    if (!res.ok && isProductSlug) {
      const slug = endpoint.replace('/products/', '');
      const [fallbackList, reviews] = await Promise.all([loadFallbackProducts(), loadFallbackReviews()]);
      if (fallbackList) {
        const product = fallbackList.find((p: any) => p.slug.toLowerCase() === slug.toLowerCase());
        if (product) {
          const related = fallbackList.filter(
            (p: any) => p.category === product.category && p._id !== product._id
          ).slice(0, 4);
          return { product, reviews, related } as unknown as T;
        }
      }
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed: ${res.status}`);
    }

    // Only fallback to static data when the API returns empty AND no search/filter is active
    const hasActiveFilter = endpoint.includes('search=') || endpoint.includes('category=') ||
      endpoint.includes('brand=') || endpoint.includes('minPrice=') || endpoint.includes('maxPrice=');
    if (isGet && isProductList && !hasActiveFilter && (data.products == null || data.products.length === 0)) {
      const fallbackList = await loadFallbackProducts();
      if (fallbackList) {
        if (endpoint === '/products/featured') {
          return { products: fallbackList.filter((p: any) => p.featured).slice(0, 8) } as unknown as T;
        }
        return {
          products: fallbackList,
          pagination: {
            page: 1,
            limit: 12,
            total: fallbackList.length,
            totalPages: 1,
            hasMore: false,
          },
        } as unknown as T;
      }
    }

    return data as T;
  } catch (err) {
    // If primary fetch failed entirely, try static fallbacks per endpoint type
    if (isGet && isProductList) {
      const fallbackList = await loadFallbackProducts();
      if (fallbackList) {
        if (endpoint === '/products/featured') {
          return { products: fallbackList.filter((p: any) => p.featured).slice(0, 8) } as unknown as T;
        }
        return {
          products: fallbackList,
          pagination: {
            page: 1,
            limit: 12,
            total: fallbackList.length,
            totalPages: 1,
            hasMore: false,
          },
        } as unknown as T;
      }
    }

    if (isGet && isCategories) {
      const fallbackList = await loadFallbackProducts();
      if (fallbackList) {
        const categories = Array.from(new Set(fallbackList.map((p: any) => p.category)));
        const brands = Array.from(new Set(fallbackList.map((p: any) => p.brand)));
        return { categories, brands } as unknown as T;
      }
    }

    if (isProductSlug) {
      const slug = endpoint.replace('/products/', '');
      const [fallbackList, reviews] = await Promise.all([loadFallbackProducts(), loadFallbackReviews()]);
      if (fallbackList) {
        const product = fallbackList.find((p: any) => p.slug.toLowerCase() === slug.toLowerCase());
        if (product) {
          const related = fallbackList.filter(
            (p: any) => p.category === product.category && p._id !== product._id
          ).slice(0, 4);
          return { product, reviews, related } as unknown as T;
        }
      }
    }

    throw err;
  }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('sessionId', id);
  }
  return id;
}

export async function trackBehavior(
  productId: string,
  eventType: 'view' | 'click' | 'add_to_cart' | 'purchase',
  category?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await api('/behavior/track', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: getSessionId(),
        productId,
        eventType,
        category,
        metadata,
      }),
    });
  } catch {
    // non-blocking
  }
}

/**
 * Track a user search query. Fires a synthetic behavior event attached to a
 * sentinel productId so the AI can see what terms the user has searched.
 * We use the special productId 'SEARCH_EVENT' which the server stores in metadata.
 */
export async function trackSearch(query: string) {
  if (!query.trim()) return;
  try {
    await fetch(`${API_URL}/behavior/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId(), query }),
    });
  } catch {
    // non-blocking
  }
}
