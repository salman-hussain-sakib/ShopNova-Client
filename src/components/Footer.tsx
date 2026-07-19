import Link from 'next/link';
import { Sparkles, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-[var(--surface)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4 text-white">
              <Sparkles className="w-6 h-6 text-primary" />
              ShopNova
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Your intelligent shopping destination. Discover curated products with AI-powered recommendations and personalized assistance.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[var(--foreground)]">Shop</h4>
            <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
              <li><Link href="/products" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">All Products</Link></li>
              <li><Link href="/products?category=Audio" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">Audio</Link></li>
              <li><Link href="/products?category=Computers" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">Computers</Link></li>
              <li><Link href="/products?category=Wearables" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">Wearables</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[var(--foreground)]">Company</h4>
            <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
              <li><Link href="/about" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/auth/login" className="text-[var(--foreground)]/85 hover:text-secondary transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[var(--foreground)]">Contact</h4>
            <ul className="space-y-3 text-sm text-[var(--foreground)]/70">
              <li className="flex items-center gap-2 text-[var(--foreground)]/85">
                <Mail className="w-4 h-4 text-primary" />
                support@shopnova.com
              </li>
              <li className="flex items-center gap-2 text-[var(--foreground)]/85">
                <Phone className="w-4 h-4 text-primary" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-[var(--foreground)]/85">
                <MapPin className="w-4 h-4 text-primary" />
                742 Evergreen Terrace, Springfield
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--foreground)]/60">
          <p className="text-[var(--foreground)]/70">&copy; {new Date().getFullYear()} ShopNova. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[var(--foreground)]/85 hover:text-[var(--foreground)] transition-colors">Privacy</Link>
            <Link href="/contact" className="text-[var(--foreground)]/85 hover:text-[var(--foreground)] transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
