'use client';

import { Shield, Truck, RefreshCw, Award, Zap, HeartHandshake } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75 with 2-day delivery to most locations.' },
  { icon: Shield, title: 'Secure Checkout', desc: '256-bit SSL encryption protects every transaction.' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free returns on all eligible items.' },
  { icon: Award, title: 'Quality Guaranteed', desc: 'Every product is vetted by our curation team.' },
  { icon: Zap, title: 'AI-Powered Search', desc: 'Find exactly what you need with intelligent product discovery.' },
  { icon: HeartHandshake, title: 'Expert Support', desc: 'Our team and AI assistant are here to help 24/7.' },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-[var(--surface)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="pop">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--foreground)]">Why Shop With ShopNova</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} variant="pop" delay={i * 70}>
              <div className="flex gap-4 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-strong)] p-6 shadow-xl shadow-black/10 h-full">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">{f.title}</h3>
                  <p className="text-[var(--foreground)]/80 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
