'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Shield, Truck, HeadphonesIcon } from 'lucide-react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animations after mount
    const timer = setTimeout(() => setLoaded(true), 100);

    // Skip pointer parallax on touch devices for smoother performance
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const handleScroll = () => setScrollY(window.scrollY);
    const handlePointerMove = (event: PointerEvent) => {
      if (isTouch) return;
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (!isTouch) {
      window.addEventListener('pointermove', handlePointerMove);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  const parallax = Math.min(scrollY / 500, 1);
  // Reduce tilt intensity on mobile for smoother experience
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const tiltMultiplier = isMobile ? 0.3 : 1;
  const tiltX = -pointer.y * 8 * tiltMultiplier;
  const tiltY = pointer.x * 10 * tiltMultiplier;

  return (
    <section className="relative min-h-[70vh] overflow-hidden py-20 sm:py-24 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ── Left: Text content with staggered 3D entrance ─────────── */}
          <div className="space-y-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur transition-all duration-700"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded
                  ? 'perspective(600px) rotateX(0deg) translateY(0) scale(1)'
                  : 'perspective(600px) rotateX(15deg) translateY(30px) scale(0.9)',
                transitionDelay: '0.1s',
              }}
            >
              <Sparkles className="h-4 w-4" />
              Immersive Commerce Experience
            </div>

            {/* Title */}
            <h1
              className="max-w-2xl text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl transition-all duration-800"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded
                  ? 'perspective(600px) rotateX(0deg) translateY(0) scale(1)'
                  : 'perspective(600px) rotateX(12deg) translateY(40px) scale(0.95)',
                transitionDelay: '0.25s',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              Explore <span className="text-primary">ShopNova</span>
            </h1>

            {/* Description */}
            <p
              className="max-w-xl text-lg leading-relaxed text-[var(--neutral)] transition-all duration-700"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded
                  ? 'perspective(600px) rotateX(0deg) translateY(0)'
                  : 'perspective(600px) rotateX(10deg) translateY(30px)',
                transitionDelay: '0.4s',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              Shop smarter with AI-powered recommendations, curated collections, and a seamless shopping experience built just for you.
            </p>

            {/* Buttons */}
            <div
              className="flex flex-wrap gap-4 transition-all duration-700"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded
                  ? 'perspective(600px) rotateY(0deg) translateX(0) scale(1)'
                  : 'perspective(600px) rotateY(-15deg) translateX(-30px) scale(0.95)',
                transitionDelay: '0.55s',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <Link href="/products" className="btn-primary inline-flex items-center gap-2">
                Enter 3D Store <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/about" className="btn-outline">
                See the Vision
              </Link>
            </div>

            {/* Feature pills */}
            <div
              className="flex flex-wrap gap-6 pt-4 transition-all duration-700"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded
                  ? 'perspective(600px) rotateY(0deg) translateX(0)'
                  : 'perspective(600px) rotateY(10deg) translateX(20px)',
                transitionDelay: '0.7s',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <div className="flex items-center gap-2 text-sm text-[var(--neutral)]">
                <Truck className="h-5 w-5 text-secondary" />
                Fast immersive delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--neutral)]">
                <Shield className="h-5 w-5 text-secondary" />
                Premium digital experience
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--neutral)]">
                <HeadphonesIcon className="h-5 w-5 text-secondary" />
                AI-guided discovery
              </div>
            </div>
          </div>

          {/* ── Right: 3D stage with parallax tilt ────────────────────── */}
          <div
            className="relative mx-auto flex w-full max-w-[480px] h-[400px] items-center justify-center select-none pointer-events-none transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded
                ? `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0) scale(1)`
                : 'perspective(1000px) rotateX(20deg) rotateY(-15deg) translateZ(-80px) scale(0.85)',
              transitionDelay: '0.3s',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-3xl animate-pulse" />

            {/* Floating tags */}
            <div
              className="absolute top-[15%] left-[5%] backdrop-blur-md bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-2xl shadow-xl animate-float-slow text-slate-900 dark:text-slate-100"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                transitionDelay: '0.8s',
              }}
            >
              <span className="text-primary font-bold mr-2">{'\u2726'}</span> AI Discovery
            </div>

            <div
              className="absolute bottom-[25%] right-[5%] backdrop-blur-md bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-2xl shadow-xl animate-float-medium text-slate-900 dark:text-slate-100"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                transitionDelay: '0.95s',
              }}
            >
              <span className="text-secondary font-bold mr-2">{'\u26A1'}</span> 60 FPS Parallax
            </div>

            <div
              className="absolute top-[45%] right-[12%] backdrop-blur-md bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-2xl shadow-xl animate-float-fast text-slate-900 dark:text-slate-100"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                transitionDelay: '1.1s',
              }}
            >
              <span className="text-accent font-bold mr-2">{'\u{1F6D2}'}</span> Immersive Storefront
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
