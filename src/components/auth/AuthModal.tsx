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
import Gallery from '@solar-icons/react/csr/video/Gallery';
import { X } from 'lucide-react';

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
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 hover:bg-stone-200 text-stone-500 hover:text-stone-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Left panel — form */}
          <div className="p-8 sm:p-10 pr-8 sm:pr-10">
            <DialogHeader className="text-left mb-8 pr-6">
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
                  Or
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
                className="w-full bg-[#0072ff] text-white hover:bg-[#0060dd] focus-visible:ring-[#0072ff]/50"
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

          {/* Right panel — image placeholder */}
          <div className="hidden sm:flex bg-stone-100 items-center justify-center">
            <Gallery className="w-16 h-16 text-stone-300" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
