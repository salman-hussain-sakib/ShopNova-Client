'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const categories = [
  { name: 'Audio', desc: 'Headphones, speakers & more', href: '/products?category=Audio', emoji: '\u{1F3A7}' },
  { name: 'Computers', desc: 'Laptops & accessories', href: '/products?category=Computers', emoji: '\u{1F4BB}' },
  { name: 'Wearables', desc: 'Smart watches & fitness', href: '/products?category=Wearables', emoji: '\u231A' },
  { name: 'Gaming', desc: 'Keyboards, mice & gear', href: '/products?category=Gaming', emoji: '\u{1F3AE}' },
  { name: 'Home Office', desc: 'Desks, lamps & webcams', href: '/products?category=Home Office', emoji: '\u{1F3E0}' },
  { name: 'Kitchen', desc: 'Appliances & tools', href: '/products?category=Kitchen', emoji: '\u2615' },
];

export function CategoriesSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="pop">
          <h2 className="text-3xl font-bold text-[var(--foreground)] text-center mb-12">Shop by Category</h2>
        </ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.name} variant="pop" delay={i * 60}>
              <Link
                href={cat.href}
                className="card p-5 text-center hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all group block"
              >
                <span className="text-3xl mb-3 block group-hover:scale-125 transition-transform duration-300">{cat.emoji}</span>
                <h3 className="font-semibold text-[var(--foreground)] group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-xs text-[var(--neutral)] mt-1">{cat.desc}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="pop">
          <div className="card bg-gradient-to-r from-primary to-primary-dark p-10 md:p-16 text-white text-center relative overflow-hidden">
            <div className="liquid-blob absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Shop Smarter?</h2>
              <p className="text-white/90 max-w-xl mx-auto mb-8">
                Join thousands of happy customers who trust ShopNova for quality products and AI-powered shopping assistance.
              </p>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-neutral-light transition-colors">
                Start Shopping <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const testimonials = [
    { name: 'Sarah M.', text: 'The AI assistant helped me find the perfect headphones in minutes. Better than browsing for hours!', rating: 5 },
    { name: 'James C.', text: 'Smart recommendations actually understood my preferences. Every suggestion was spot on.', rating: 5 },
    { name: 'Emily R.', text: 'Fast shipping, great products, and the return process was seamless. Highly recommend ShopNova.', rating: 5 },
  ];

  return (
    <section className="py-16 bg-neutral-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="pop">
          <h2 className="text-3xl font-bold text-neutral-dark text-center mb-12">What Our Customers Say</h2>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} variant={i === 0 ? 'left' : i === 2 ? 'right' : 'pop'} delay={i * 100}>
              <div className="card p-6 h-full">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-accent">{'\u2605'}</span>
                  ))}
                </div>
                <p className="text-neutral-dark/80 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <p className="font-semibold text-neutral-dark text-sm">{t.name}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  const stats = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '12', label: 'Product Categories' },
    { value: '4.6', label: 'Average Rating' },
    { value: '24/7', label: 'AI Support' },
  ];

  return (
    <section className="py-12 border-y border-neutral/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} variant="pop" delay={i * 80}>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{s.value}</p>
                <p className="text-neutral text-sm mt-1">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  return (
    <section className="py-16">
      <div className="max-w-xl mx-auto px-4 text-center">
        <ScrollReveal variant="pop">
          <h2 className="text-2xl font-bold text-neutral-dark mb-2">Stay in the Loop</h2>
          <p className="text-neutral mb-6">Get exclusive deals and product launches delivered to your inbox.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="input-field flex-1" required />
            <button type="submit" className="btn-primary whitespace-nowrap">Subscribe</button>
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}
