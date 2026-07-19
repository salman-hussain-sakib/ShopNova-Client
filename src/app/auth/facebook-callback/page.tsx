'use client';

import { useEffect } from 'react';

export default function FacebookCallback() {
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (window.opener) {
      if (accessToken) {
        window.opener.postMessage({ type: 'FACEBOOK_AUTH_SUCCESS', accessToken }, window.location.origin);
      } else {
        window.opener.postMessage({ type: 'FACEBOOK_AUTH_ERROR' }, window.location.origin);
      }
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral">Completing Facebook login...</p>
      </div>
    </div>
  );
}
