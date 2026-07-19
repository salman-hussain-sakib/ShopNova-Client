'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { Product, trackBehavior } from '@/lib/api';
import { useCart } from '@/lib/cart';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // ── Scroll-triggered 3D entrance ──────────────────────────────────────
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger delay based on index within the visible batch
          const delay = (index % 4) * 120;
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -12;
    const tiltY = ((x - centerX) / centerX) * 12;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleClick = () => {
    trackBehavior(product._id, 'click', product.category);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    trackBehavior(product._id, 'add_to_cart', product.category);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // ── 3D entrance transform ─────────────────────────────────────────────
  // Each card gets a unique rotation axis based on its position in the grid
  const col = index % 4;
  const entranceRotateY = col < 2 ? -25 : 25;   // left cards rotate from left, right from right
  const entranceRotateX = 15;
  const entranceTranslateZ = -120;

  // Entrance style (before visible)
  const hiddenStyle: React.CSSProperties = {
    transform: `perspective(900px) rotateX(${entranceRotateX}deg) rotateY(${entranceRotateY}deg) translateZ(${entranceTranslateZ}px) scale(0.8)`,
    opacity: 0,
    transition: 'none',
  };

  // Visible style (after scroll trigger)
  const visibleStyle: React.CSSProperties = {
    transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0px) scale(1)`,
    opacity: 1,
    transition: 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease-out, box-shadow 0.3s',
  };

  // Hover tilt overrides transition for snappy response
  const hoverStyle: React.CSSProperties = tilt.x !== 0
    ? {
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(12px) scale(1.02)`,
        opacity: 1,
        transition: 'transform 0.12s ease-out, box-shadow 0.3s',
      }
    : {};

  return (
    <Link
      ref={cardRef}
      href={`/products/${product.slug}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card group overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-primary/15"
      style={{
        transformStyle: 'preserve-3d',
        ...(visible ? (tilt.x !== 0 ? hoverStyle : visibleStyle) : hiddenStyle),
      }}
    >
      {/* ── Product image with 3D depth ──────────────────────────────── */}
      <div
        className="relative aspect-square overflow-hidden bg-neutral-light"
        style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
      >
        <Image
          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 25vw"
          style={{ transform: 'translateZ(8px)' }}
        />

        {/* Shimmer overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-white/0 to-white/0 group-hover:from-primary/5 group-hover:via-white/10 group-hover:to-primary/5 transition-all duration-500 pointer-events-none" />

        {discount > 0 && (
          <span
            className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg"
            style={{ transform: 'translateZ(15px)' }}
          >
            -{discount}%
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span
            className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg"
            style={{ transform: 'translateZ(15px)' }}
          >
            Low Stock
          </span>
        )}
      </div>

      {/* ── Product info with 3D pop ─────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1" style={{ transform: 'translateZ(12px)' }}>
        <p className="text-xs text-neutral uppercase tracking-wide mb-1">{product.brand}</p>
        <h3 className="font-semibold text-neutral-dark line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-neutral">({product.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-neutral-dark">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-neutral line-through ml-2">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-medium ${
              added
                ? 'bg-secondary text-white scale-110 shadow-lg shadow-secondary/30'
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/30'
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
}


export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-2/3 skeleton rounded" />
        <div className="h-5 w-20 skeleton rounded" />
      </div>
    </div>
  );
}
