'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Lock, CheckCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { trackBehavior } from '@/lib/api';

type CardType = 'visa' | 'mastercard' | 'amex' | 'unknown';

function detectCardType(number: string): CardType {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'unknown';
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

const CARD_LOGOS: Record<CardType, string> = {
  visa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
  mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',
  amex: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/200px-American_Express_logo.svg.png',
  unknown: '',
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart, isLoaded } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [purchasedTotal, setPurchasedTotal] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);

  const shipping = subtotal > 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const cardType = detectCardType(cardNumber);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'Valid email required';
    if (!address.trim()) e.address = 'Address required';
    if (!city.trim()) e.city = 'City required';
    if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Valid 16-digit card number required';
    if (!cardName.trim()) e.cardName = 'Cardholder name required';
    if (!/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = 'Valid expiry (MM/YY) required';
    if (cvv.length < 3) e.cvv = 'Valid CVV required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // Capture items BEFORE clearing cart
    const itemsToSave = [...items];
    setPurchasedItems(itemsToSave);
    setPurchasedTotal(total);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2200));
    // Fire purchase behavior events for every item (non-blocking)
    itemsToSave.forEach(({ product }) => {
      trackBehavior(product._id, 'purchase', product.category);
    });
    setLoading(false);
    setSuccess(true);
    clearCart();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoaded) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral text-sm">Loading checkout...</p>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-neutral-dark mb-2">Your cart is empty</h1>
        <p className="text-neutral mb-6">Add some products before checking out.</p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-14 h-14 text-secondary" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-dark mb-3">Order Confirmed! 🎉</h1>
        <p className="text-neutral mb-2">Thank you for shopping with ShopNova.</p>
        <p className="text-neutral text-sm mb-8">A confirmation email has been sent to <strong>{email}</strong>.</p>
        <div className="card p-5 mb-8 text-left space-y-2 text-sm">
          <p className="font-semibold text-neutral-dark mb-2">Order Summary</p>
          <div className="divide-y divide-neutral/10 space-y-2 mb-3">
            {purchasedItems.map(({ product, quantity }) => (
              <div key={product._id} className="flex justify-between items-center py-1">
                <span className="text-neutral line-clamp-1">{product.name} (x{quantity})</span>
                <span className="font-semibold text-[var(--foreground)]">${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-neutral pt-2 border-t border-neutral/10">Total paid: <span className="font-bold text-primary">${purchasedTotal.toFixed(2)}</span></p>
          <p className="text-neutral">Estimated delivery: <span className="font-medium text-[var(--foreground)]">3–5 business days</span></p>
        </div>
        <Link href="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const inputStyle = {
    background: 'var(--surface-strong)',
    color: 'var(--foreground)',
    border: '1.5px solid var(--border-color)',
  };

  const inputClass = 'w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-neutral';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/products" className="inline-flex items-center gap-1 text-neutral hover:text-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Shopping
      </Link>

      <h1 className="text-3xl font-bold text-neutral-dark mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Left — Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">

          {/* Contact */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-lg text-neutral-dark">Contact & Delivery</h2>
            <div>
              <label className="text-sm font-medium text-neutral-dark block mb-1.5">Email address</label>
              <input style={inputStyle} className={inputClass} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-dark block mb-1.5">Shipping address</label>
              <input style={inputStyle} className={inputClass} type="text" placeholder="123 Main Street, Apt 4B" value={address} onChange={e => setAddress(e.target.value)} />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-dark block mb-1.5">City</label>
              <input style={inputStyle} className={inputClass} type="text" placeholder="New York" value={city} onChange={e => setCity(e.target.value)} />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-neutral-dark flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Card Payment
              </h2>
              <div className="flex items-center gap-1 text-xs text-secondary">
                <Lock className="w-3 h-3" /> Secured by SSL
              </div>
            </div>

            {/* Animated Card Preview */}
            <div className="perspective-1000 h-44 w-full max-w-sm mx-auto" style={{ perspective: '1000px' }}>
              <div
                className="relative w-full h-full transition-transform duration-700"
                style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* Front */}
                <div className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between text-white overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #6d5dfc, #4f3df2)', backfaceVisibility: 'hidden' }}>
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-10 h-7 rounded bg-yellow-300/80 flex items-center justify-center">
                      <div className="w-7 h-5 rounded bg-yellow-400/60 grid grid-cols-2 gap-0.5 p-0.5">
                        {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm bg-yellow-500/70" />)}
                      </div>
                    </div>
                    {cardType !== 'unknown' && (
                      <div className="relative h-8 w-14">
                        <Image src={CARD_LOGOS[cardType]} alt={cardType} fill className="object-contain" sizes="56px" />
                      </div>
                    )}
                  </div>
                  <div className="relative z-10">
                    <p className="text-lg font-mono tracking-widest">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between mt-2 text-xs text-white/80">
                      <span>{cardName || 'CARDHOLDER NAME'}</span>
                      <span>{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>
                {/* Back */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden text-white flex flex-col justify-center"
                  style={{ background: 'linear-gradient(135deg, #4f3df2, #6d5dfc)', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="bg-black/40 h-10 w-full mt-6" />
                  <div className="px-5 mt-4 flex justify-end">
                    <div className="bg-white/90 text-neutral-dark rounded-lg px-4 py-1.5 text-sm font-mono tracking-widest">
                      {cvv || '•••'}
                    </div>
                  </div>
                  <p className="text-center text-xs text-white/60 mt-3">CVV</p>
                </div>
              </div>
            </div>

            {/* Card Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-dark block mb-1.5">Card Number</label>
                <input style={inputStyle} className={`${inputClass} font-mono tracking-widest`}
                  type="text" placeholder="1234 5678 9012 3456" value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} />
                {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-dark block mb-1.5">Cardholder Name</label>
                <input style={inputStyle} className={inputClass}
                  type="text" placeholder="JOHN DOE" value={cardName}
                  onChange={e => setCardName(e.target.value.toUpperCase())} />
                {errors.cardName && <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-dark block mb-1.5">Expiry Date</label>
                  <input style={inputStyle} className={inputClass}
                    type="text" placeholder="MM/YY" value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={5} />
                  {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-dark block mb-1.5">CVV</label>
                  <input style={inputStyle} className={inputClass}
                    type="text" placeholder="•••" value={cvv}
                    onFocus={() => setFlipped(true)} onBlur={() => setFlipped(false)}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} />
                  {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Pay ${total.toFixed(2)} securely
              </>
            )}
          </button>
        </form>

        {/* Right — Order Summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg text-neutral-dark">Order Summary</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map(({ product, quantity }) => (
                <div key={product._id} className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                    <Image src={product.images[0]} alt={product.name} fill className="object-contain p-1" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">{product.name}</p>
                    <p className="text-xs text-neutral">Qty: {quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-primary flex-shrink-0">${(product.price * quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral/10 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-neutral">
                <span>Subtotal</span><span className="text-[var(--foreground)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-secondary font-medium' : 'text-[var(--foreground)]'}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-neutral">
                <span>Tax (8%)</span><span className="text-[var(--foreground)]">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral/10">
                <span className="text-neutral-dark">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral bg-secondary/10 text-secondary rounded-xl px-3 py-2">
              <Lock className="w-3 h-3 flex-shrink-0" />
              Your payment information is encrypted and secure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
