'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setEmail('');
      setPassword('');
      setIsSignUp(false);
      setLoading(false);
    }, 200);
  }, [onClose]);

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
        handleClose();
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-5xl p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Left panel — form */}
          <div className="p-8 sm:p-10">
            <DialogHeader className="text-left mb-8">
              <DialogTitle className="text-2xl">
                {isSignUp ? 'Create your account' : 'Log in to your account'}
              </DialogTitle>
              <DialogDescription>
                {isSignUp
                  ? 'Get started with Parse & Plate'
                  : 'Welcome back to Parse & Plate'}
              </DialogDescription>
            </DialogHeader>

            {/* Social login */}
            <div className="space-y-3 mb-6">
              <Button variant="outline" className="w-full justify-start" onClick={handleGoogleLogin}>
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                Sign in with Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-stone-400 font-albert uppercase">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-sm font-medium text-stone-700 font-albert">
                  Email
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className="text-sm font-medium text-stone-700 font-albert">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs text-stone-400 hover:text-stone-600 font-albert transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-blue hover:bg-primary-blue/90 focus-visible:ring-primary-blue/50"
                size="lg"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-500 font-albert">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-stone-900 hover:underline underline-offset-2"
              >
                {isSignUp ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Right panel — placeholder image */}
          <div className="hidden sm:flex relative bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,114,255,0.15),transparent_60%)]" />
            <div className="relative flex flex-col items-center gap-4 p-10">
              <div className="w-64 h-44 rounded-xl bg-white/60 shadow-lg backdrop-blur-sm border border-white/80 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="w-10 h-10 rounded-lg bg-primary-blue/10 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <p className="font-domine text-sm font-semibold text-stone-800">Parse & Plate</p>
                  <p className="font-albert text-xs text-stone-500 mt-1">Your recipes, organized</p>
                </div>
              </div>
              <div className="w-48 h-28 rounded-lg bg-white/40 shadow-md backdrop-blur-sm border border-white/60 -mt-6 ml-20" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
