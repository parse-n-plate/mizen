'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      if (isSignUp) alert('Check your email for a confirmation link!');
      else {
        onClose();
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-stone-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-stone-900 font-albert">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors mb-6 font-medium text-stone-700"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">Or email</span></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input 
              type="email" placeholder="Email address" required
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-200 outline-none"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Password" required
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-200 outline-none"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              disabled={loading}
              className="w-full py-3 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-stone-900 font-bold hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}