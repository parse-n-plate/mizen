"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { resolveEmailAuthFeedback } from "@/lib/auth-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Login from "@solar-icons/react/csr/arrows-action/Login";
import Eye from "@solar-icons/react/csr/security/Eye";
import EyeClosed from "@solar-icons/react/csr/security/EyeClosed";

type Mode = "login" | "forgot";

interface BetaAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TRANSITION = { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const };
const INSTANT = { duration: 0 };

export function BetaAuthModal({ open, onOpenChange, onSuccess }: BetaAuthModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = shouldReduceMotion ? INSTANT : TRANSITION;

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const openRef = useRef(open);
  const closeResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    openRef.current = open;
    if (open && closeResetTimeoutRef.current) {
      clearTimeout(closeResetTimeoutRef.current);
      closeResetTimeoutRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeResetTimeoutRef.current) {
        clearTimeout(closeResetTimeoutRef.current);
      }
    };
  }, []);

  const clearMessages = () => {
    setError(null);
    setMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      if (closeResetTimeoutRef.current) {
        clearTimeout(closeResetTimeoutRef.current);
      }
      closeResetTimeoutRef.current = setTimeout(() => {
        if (openRef.current) return;
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setMode("login");
        clearMessages();
        setLoading(false);
      }, 200);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is unavailable right now. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const feedback = resolveEmailAuthFeedback("login", { error });
    if (feedback.error) {
      setError(feedback.error);
    } else if (feedback.shouldClose) {
      handleOpenChange(false);
      onSuccess?.();
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    clearMessages();

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is unavailable right now. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }

    setLoading(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearMessages();
  };

  const titles: Record<Mode, { title: string; description: string }> = {
    login: { title: "Sign in to Mizen", description: "Enter your beta credentials to continue" },
    forgot: { title: "Reset password", description: "We\u2019ll send you a reset link" },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-xl">
        <div>
          <div className="p-8 sm:p-10">
            <DialogHeader className="text-left mb-6 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={t}
                >
                  <DialogTitle className="font-serif text-2xl">{titles[mode].title}</DialogTitle>
                  <DialogDescription className="mt-1">{titles[mode].description}</DialogDescription>
                </motion.div>
              </AnimatePresence>
            </DialogHeader>

            {/* ─── Forgot password form ─── */}
            {mode === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="beta-auth-reset-email"
                    className="font-sans text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="beta-auth-reset-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    spellCheck={false}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="font-sans text-sm text-red-500 dark:text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                  {message && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="font-sans text-sm text-green-600 dark:text-green-400"
                    >
                      {message}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-mizen-blue text-white hover:bg-mizen-blue/90 focus-visible:ring-mizen-blue/50"
                  size="lg"
                >
                  {loading ? <Spinner /> : "Send Reset Link"}
                </Button>

                <p className="font-sans text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-sans font-semibold text-foreground hover:underline underline-offset-2"
                  >
                    Back to sign in
                  </button>
                </p>
              </form>
            ) : (
              /* ─── Login form ─── */
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="beta-auth-email"
                    className="font-sans text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="beta-auth-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="beta-auth-password"
                      className="font-sans text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <motion.button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Reset your password"
                    >
                      Forgot password?
                    </motion.button>
                  </div>
                  <div className="relative">
                    <Input
                      id="beta-auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeClosed className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="font-sans text-sm text-red-500 dark:text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                  {message && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="font-sans text-sm text-green-600 dark:text-green-400"
                    >
                      {message}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-mizen-blue text-white hover:bg-mizen-blue/90 focus-visible:ring-mizen-blue/50"
                  size="lg"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={loading ? "loading" : "login-btn"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={t}
                      className="flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Spinner />
                      ) : (
                        <>
                          <Login className="h-4 w-4" />
                          Sign in
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </form>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}


function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
