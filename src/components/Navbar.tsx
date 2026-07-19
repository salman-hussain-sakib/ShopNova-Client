'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import CartDrawer from './CartDrawer';
import { LogOut, User, Sparkles, ShoppingBag, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import FacebookLoginButton from './FacebookLoginButton';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
  }, []);

  const startCollapseTimer = useCallback(() => {
    clearCollapseTimer();
    collapseTimer.current = setTimeout(() => setLoginOpen(false), 2500);
  }, [clearCollapseTimer]);

  const handleMouseEnter = () => {
    if (isTouch) return;
    setLoginOpen(true);
    startCollapseTimer();
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    startCollapseTimer();
  };

  const handleLoginTap = () => {
    setLoginOpen((prev) => !prev);
    if (!loginOpen) startCollapseTimer();
  };

  const handleFieldFocus = () => clearCollapseTimer();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    };
    if (loginOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [loginOpen]);

  return (
    <>
      <nav key="navbar-remount-fix-2" className="fixed top-0 left-0 right-0 z-50 text-[var(--foreground)] pt-6 pb-2 pointer-events-none">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pointer-events-none">
          <div className="nav-jelly left pointer-events-none"></div>
          <div className="nav-jelly right pointer-events-none"></div>
          
          <div className="pointer-events-auto">
            <div className="nav-inner">
              <Link href="/" className="flex items-center gap-3 font-bold text-lg">
                <div className="p-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ShopNova</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link href="/products" className="jelly-link">
                  Products
                </Link>
                <Link href="/about" className="jelly-link">
                  About
                </Link>
                <Link href="/contact" className="jelly-link">
                  Contact
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link href="/items/add" className="jelly-link text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base leading-none">＋</span> Add Product
                      </span>
                    </Link>
                    <Link href="/items/manage" className="jelly-link text-secondary">
                      Manage Products
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Cart icon */}
                <button
                  onClick={() => setCartOpen(true)}
                  className="glass-button p-2 relative"
                  aria-label="Open cart"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {mounted && count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>

                <div
                  ref={loginRef}
                  className="relative cursor-pointer"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button onClick={handleLoginTap} className="glass-button text-sm px-4 py-2 flex items-center justify-center min-w-[80px] hover:scale-105 cursor-pointer">
                    {user ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    ) : (
                      'Login'
                    )}
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-80 card p-5 transition-all duration-300 origin-top-right ${
                      loginOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    {user ? (
                      <HoverAccountMenu user={user} logout={logout} closeMenu={() => setLoginOpen(false)} />
                    ) : (
                      <HoverLoginForm onFieldFocus={handleFieldFocus} onSuccess={() => setLoginOpen(false)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function HoverLoginForm({
  onFieldFocus,
  onSuccess,
}: {
  onFieldFocus: () => void;
  onSuccess: () => void;
}) {
  const { login, demoLogin, googleLogin, facebookLogin } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await demoLogin();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!profileRes.ok) throw new Error('Failed to retrieve user profile from Google');
        const profile = await profileRes.json();
        
        await googleLogin(profile, 'profile');
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  const handleFacebook = async (accessToken: string) => {
    setLoading(true);
    try {
      await facebookLogin(accessToken);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Facebook login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-neutral-dark mb-3">Welcome back</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Email or phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onFocus={onFieldFocus}
          className="input-field text-sm"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={onFieldFocus}
            className="input-field text-sm pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-primary transition-colors focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full text-sm disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div className="mt-3 space-y-2">
        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full py-2 text-sm rounded-xl border border-secondary text-secondary hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
        >
          Demo Login
        </button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-[#0f172a] px-3 py-0.5 text-[10px] font-semibold text-neutral/70 uppercase tracking-wider rounded-full border border-neutral/10">Or continue with</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 py-0.5">
          <button
            type="button"
            onClick={() => handleGoogle()}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-neutral-dark dark:text-white transition-all duration-300 shadow-md shadow-neutral/5 border border-neutral/15 hover:border-neutral/30 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.95] cursor-pointer"
            aria-label="Continue with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.39 3.67 1.41 7.56l3.86 3c.92-2.77 3.51-4.82 6.73-4.82z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.87 3.38-8.48z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.12c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.41 6.52C.51 8.32 0 10.31 0 12.4s.51 4.08 1.41 5.88l3.86-2.98z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.22 0-5.81-2.05-6.73-4.82L1.41 16.5C3.39 20.33 7.35 23 12 23z"
              />
            </svg>
          </button>
          <FacebookLoginButton
            onSuccess={handleFacebook}
            onError={() => setError('Facebook sign-in failed')}
            variant="icon"
          />
        </div>
      </div>
      <p className="text-xs text-neutral text-center mt-3">
        No account?{' '}
        <button onClick={() => router.push('/auth/register')} className="text-primary hover:underline">
          Register
        </button>
      </p>
    </div>
  );
}

function HoverAccountMenu({ user, logout, closeMenu }: { user: any, logout: () => void, closeMenu: () => void }) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    closeMenu();
    router.push('/');
  };

  const navigateTo = (path: string) => {
    closeMenu();
    router.push(path);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral/10">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <div>
          <p className="font-semibold text-[var(--foreground)] truncate max-w-[180px]">{user?.name || 'User'}</p>
          <p className="text-xs text-neutral truncate max-w-[180px]">{user?.email}</p>
        </div>
      </div>
      
      <div className="space-y-1 mb-4">
        {user?.role === 'admin' ? (
          <button
            onClick={() => navigateTo('/admin')}
            className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-strong)] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-secondary" /> Admin Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigateTo('/profile')}
            className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-strong)] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4 text-primary" /> Profile
          </button>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}
