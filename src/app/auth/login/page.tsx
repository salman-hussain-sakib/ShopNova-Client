'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginButton from '@/components/FacebookLoginButton';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, demoLogin, googleLogin, facebookLogin, user } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
        router.push('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-neutral-dark mb-2">Sign In</h1>
        <p className="text-neutral text-sm mb-6">Welcome back to ShopNova</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-dark mb-1 block">Email or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-dark mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-primary transition-colors focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 space-y-3">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await demoLogin();
                router.push('/');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Demo login failed');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border-2 border-secondary text-secondary font-medium hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
          >
            Demo Login
          </button>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-neutral/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#0f172a] px-3 py-0.5 text-[10px] font-semibold text-neutral/70 uppercase tracking-wider rounded-full border border-neutral/10">Or continue with</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-1">
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
              onSuccess={async (token) => {
                setLoading(true);
                try {
                  await facebookLogin(token);
                  router.push('/');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Facebook login failed');
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => setError('Facebook sign-in failed')}
              variant="icon"
            />
          </div>
        </div>

        <p className="text-sm text-neutral text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
