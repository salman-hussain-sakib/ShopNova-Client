'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, count, subtotal, isLoaded, removeFromCart, updateQuantity, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const shipping = subtotal > 75 ? 0 : 9.99;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-full sm:w-[420px] flex flex-col pointer-events-auto transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--surface-strong)', borderLeft: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-[var(--foreground)]">Your Cart</h2>
            {mounted && count > 0 && (
              <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mounted && items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-neutral hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral/10 transition-colors">
              <X className="w-5 h-5 text-neutral" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!mounted || !isLoaded ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-primary/50" />
              </div>
              <p className="font-semibold text-neutral-dark">Your cart is empty</p>
              <p className="text-sm text-neutral">Browse our catalog and add products to your cart.</p>
              <button
                onClick={() => { onClose(); router.push('/products'); }}
                className="btn-primary text-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product._id}
                className="flex gap-3 p-3 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">{product.name}</p>
                  <p className="text-xs text-neutral mt-0.5">{product.brand}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-[var(--foreground)]">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">${(product.price * quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="p-1 rounded-lg text-neutral/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {mounted && items.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral/10 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral">
                <span>Subtotal</span>
                <span className="text-[var(--foreground)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-secondary font-medium' : 'text-[var(--foreground)]'}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-neutral">Add ${(75 - subtotal).toFixed(2)} more for free shipping</p>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-neutral/10">
                <span className="text-[var(--foreground)]">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
