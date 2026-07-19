'use client';

import { useEffect } from 'react';

interface FacebookLoginButtonProps {
  onSuccess: (accessToken: string) => void;
  onError: () => void;
  variant?: 'standard' | 'icon';
}

export default function FacebookLoginButton({ onSuccess, onError, variant = 'standard' }: FacebookLoginButtonProps) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  useEffect(() => {
    // Listen for messages from the OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
        onSuccess(event.data.accessToken);
      } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
        onError();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError]);

  const handleLogin = () => {
    if (!appId || appId === 'your_app_id_here') {
      alert('Facebook OAuth is not configured on this environment.');
      return;
    }
    
    const redirectUri = `${window.location.origin}/auth/facebook-callback`;
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile&response_type=token`;
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      url,
      'facebook_login',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,location=no`
    );
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleLogin}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white transition-all duration-300 shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-[0.95] cursor-pointer"
        aria-label="Continue with Facebook"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="flex items-center justify-center gap-2.5 w-full max-w-[280px] bg-[#1877F2] hover:bg-[#166FE5] text-white py-2.5 px-5 rounded-full text-sm font-semibold transition-all duration-300 shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      Continue with Facebook
    </button>
  );
}
