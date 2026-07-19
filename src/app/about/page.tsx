import Link from 'next/link';
import { Sparkles, Target, Users, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 text-primary font-medium mb-4">
          <Sparkles className="w-5 h-5" />
          About ShopNova
        </div>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Redefining Online Shopping</h1>
        <p className="text-lg text-[var(--neutral)] max-w-2xl mx-auto leading-relaxed">
          ShopNova was founded with a simple mission: make online shopping smarter, faster, and more personal. We combine curated product selection with cutting-edge AI to help you find exactly what you need.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { icon: Target, title: 'Our Mission', desc: 'Empower every shopper with intelligent tools that save time and deliver better purchase decisions.' },
          { icon: Users, title: 'Our Team', desc: 'A passionate group of engineers, designers, and retail experts building the future of e-commerce.' },
          { icon: Globe, title: 'Our Reach', desc: 'Serving customers across North America with plans to expand globally in 2027.' },
        ].map((item) => (
          <div key={item.title} className="card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
            <p className="text-sm text-[var(--neutral)] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-8 mb-12">
        <h2 className="text-2xl font-bold text-neutral-dark mb-4">Our Story</h2>
        <div className="space-y-4 text-neutral leading-relaxed">
          <p>
            ShopNova started in 2024 when our founders experienced the frustration of endless scrolling through generic product listings. They envisioned a store where AI understands your preferences and guides you to the perfect product — not just another search bar.
          </p>
          <p>
            Today, ShopNova offers a carefully curated catalog spanning audio, computing, wearables, home office, and lifestyle categories. Every product is reviewed by our team for quality and value before joining the catalog.
          </p>
          <p>
            Our AI Shopping Assistant and Smart Recommendation Engine learn from your browsing behavior to deliver increasingly personalized suggestions — making every visit feel tailored to you.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/products" className="btn-primary">Explore Our Products</Link>
      </div>
    </div>
  );
}
