"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
import UserPlus from "@solar-icons/react/csr/users/UserPlus";
import Eye from "@solar-icons/react/csr/security/Eye";
import EyeClosed from "@solar-icons/react/csr/security/EyeClosed";

type Mode = "login" | "signup" | "forgot";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "login" | "signup";
}

const TRANSITION = { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const };
const INSTANT = { duration: 0 };

export function AuthModal({
  open,
  onOpenChange,
  initialMode = "login",
}: AuthModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = shouldReduceMotion ? INSTANT : TRANSITION;

  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mode = modeOverride ?? initialMode;
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
        setModeOverride(null);
        clearMessages();
        setLoading(false);
      }, 200);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    if (!supabase) return;
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo || "/")}`,
      },
    });
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

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        handleOpenChange(false);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
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
    setModeOverride(next);
    clearMessages();
  };

  // Header text per mode
  const titles: Record<Mode, { title: string; description: string }> = {
    login: { title: "Welcome back", description: "Sign in to your Mizen account" },
    signup: { title: "Create your account", description: "Get started with Mizen" },
    forgot: { title: "Reset password", description: "We\u2019ll send you a reset link" },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* ─── Left panel: Form ─── */}
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
                  <DialogTitle className="font-serif text-2xl">
                    {titles[mode].title}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {titles[mode].description}
                  </DialogDescription>
                </motion.div>
              </AnimatePresence>
            </DialogHeader>

            {/* Google OAuth — only on login/signup */}
            {mode !== "forgot" && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleGoogleLogin}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 font-sans text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ─── Forgot password form ─── */}
            {mode === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-reset-email"
                    className="font-sans text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="auth-reset-email"
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
                  {loading ? (
                    <Spinner />
                  ) : (
                    "Send Reset Link"
                  )}
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
              /* ─── Login / Signup form ─── */
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email"
                    className="font-sans text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="auth-email"
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
                      htmlFor="auth-password"
                      className="font-sans text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <AnimatePresence initial={false}>
                      {mode === "login" && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                          onClick={() => switchMode("forgot")}
                          className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Reset your password"
                        >
                          Forgot password?
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <Input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                      key={
                        loading
                          ? "loading"
                          : mode === "login"
                            ? "login-btn"
                            : "signup-btn"
                      }
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={t}
                      className="flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Spinner />
                      ) : mode === "login" ? (
                        <>
                          <Login className="h-4 w-4" />
                          Sign in
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Create account
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </form>
            )}

            {/* Mode toggle — login ↔ signup */}
            {mode !== "forgot" && (
              <p className="mt-6 font-sans text-center text-sm text-muted-foreground">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={mode === "login" ? "login-toggle" : "signup-toggle"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.12 }}
                  >
                    {mode === "login"
                      ? "No account?"
                      : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() =>
                        switchMode(mode === "login" ? "signup" : "login")
                      }
                      className="font-sans font-semibold text-foreground hover:underline underline-offset-2"
                    >
                      {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                  </motion.span>
                </AnimatePresence>
              </p>
            )}
          </div>

          {/* ─── Right panel: Interactive branded background ─── */}
          <InteractivePanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InteractivePanel() {
  const panelRef = useRef<HTMLDivElement>(null);

  // Raw mouse position as percentage (0–100)
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  // Spring-smoothed values for the glow — feels organic, not mechanical
  const springConfig = { stiffness: 150, damping: 25, mass: 0.5 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  // Build the radial-gradient background string from spring values
  const glowBg = useTransform(
    [glowX, glowY],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, var(--color-blue), transparent 60%)`
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
      mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    // Drift back to default position
    mouseX.set(50);
    mouseY.set(50);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden sm:flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--color-cream) 0%, color-mix(in oklch, var(--color-blue) 8%, var(--color-cream)) 50%, color-mix(in oklch, var(--color-blue) 15%, var(--color-cream)) 100%)",
      }}
    >
      {/* Cursor-tracking radial glow */}
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{ background: glowBg }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-blue) 1px, transparent 1px), linear-gradient(90deg, var(--color-blue) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Branding text */}
      <span className="relative font-serif text-3xl font-semibold text-foreground/10 select-none">
        Mizen
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
