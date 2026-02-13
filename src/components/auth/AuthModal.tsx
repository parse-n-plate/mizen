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
import { LogIn, UserPlus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo || '/')}`,
      },
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
            <DialogHeader className="text-left mb-8 pr-6 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isSignUp ? 'signup-header' : 'login-header'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                >
                  <DialogTitle className="text-2xl">
                    {isSignUp ? 'Create your account' : 'Log in to your account'}
                  </DialogTitle>
                  <DialogDescription>
                    {isSignUp
                      ? 'Get started with Mizen'
                      : 'Welcome back to Mizen'}
                  </DialogDescription>
                </motion.div>
              </AnimatePresence>
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
                  <AnimatePresence initial={false}>
                    {!isSignUp && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs text-stone-400 hover:text-stone-600 font-albert transition-colors"
                      >
                        Forgot password?
                      </motion.button>
                    )}
                  </AnimatePresence>
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
                className="w-full bg-[#0072ff] text-white hover:bg-[#0060dd] focus-visible:ring-[#0072ff]/50 relative overflow-hidden"
                size="lg"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={loading ? 'loading' : isSignUp ? 'signup-btn' : 'login-btn'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Processing...'
                    ) : isSignUp ? (
                      <><UserPlus className="w-4 h-4" /> Sign up</>
                    ) : (
                      <><LogIn className="w-4 h-4" /> Sign in</>
                    )}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-500 font-albert">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isSignUp ? 'signup-toggle' : 'login-toggle'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="font-semibold text-stone-900 hover:underline underline-offset-2"
                  >
                    {isSignUp ? 'Log in' : 'Sign up'}
                  </button>
                </motion.span>
              </AnimatePresence>
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
