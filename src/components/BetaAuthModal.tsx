"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSubmitGuard } from "@/hooks/useSubmitGuard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveEmailAuthFeedback } from "@/lib/auth-feedback";
import Login from "@solar-icons/react/csr/arrows-action/Login";
import UserPlus from "@solar-icons/react/csr/users/UserPlus";
import Letter from "@solar-icons/react/csr/messages/Letter";
import Restart from "@solar-icons/react/csr/arrows/Restart";
import Eye from "@solar-icons/react/csr/security/Eye";
import EyeClosed from "@solar-icons/react/csr/security/EyeClosed";
import { Spinner } from "@/components/ui/spinner";

type EmailStatus = "idle" | "checking" | "approved" | "not-found";
type View = "form" | "link-sent" | "waitlist-joined";

interface BetaAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRANSITION = { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const };
const INSTANT = { duration: 0 };

export function BetaAuthModal({ open, onOpenChange }: BetaAuthModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="dark:bg-card">
          <AuthContent open={open} onOpenChange={onOpenChange} isMobile />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-xl dark:bg-card"
      >
        <AuthContent open={open} onOpenChange={onOpenChange} isMobile={false} />
      </DialogContent>
    </Dialog>
  );
}

function AuthContent({ open, onOpenChange, isMobile }: BetaAuthModalProps & { isMobile: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const t = shouldReduceMotion ? INSTANT : TRANSITION;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [view, setView] = useState<View>("form");
  const [loading, setLoading] = useState(false);
  const allowSubmit = useSubmitGuard();
  const openRef = useRef(open);
  const closeResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        if (openRef.current) return;
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setUsePassword(false);
        setError(null);
        setMessage(null);
        setEmailStatus("idle");
        setView("form");
        setLoading(false);
      }, 200);
      closeResetTimeoutRef.current = timeout;
    }
  }, [open]);

  const checkEmail = useCallback(async (emailToCheck: string) => {
    const trimmed = emailToCheck.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailStatus("idle");
      setError(null);
      return;
    }

    setEmailStatus("checking");
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const { exists } = await res.json();
      if (exists) {
        setEmailStatus("approved");
        setError(null);
      } else {
        setEmailStatus("not-found");
        setError(null);
      }
    } catch {
      setEmailStatus("approved");
      setError(null);
    }
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailStatus("idle");
    setError(null);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmed = value.trim();
    if (trimmed && trimmed.includes("@") && trimmed.includes(".")) {
      checkTimeoutRef.current = setTimeout(() => {
        checkEmail(trimmed);
      }, 500);
    }
  };

  const handleDevSignIn = async () => {
    if (!allowSubmit()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/dev-signin", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Dev sign-in failed.");
        setLoading(false);
        return;
      }
      // Reload so middleware and useUser pick up the fresh session cookies.
      window.location.reload();
    } catch {
      setError("Dev sign-in failed.");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is unavailable right now. Please try again.");
      return;
    }
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo || "/")}`,
      },
    });
    if (error) {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowSubmit()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is unavailable right now. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("signups not allowed")) {
        setEmailStatus("not-found");
      } else {
        setError(error.message);
      }
    } else {
      setView("link-sent");
    }

    setLoading(false);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowSubmit()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

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
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!allowSubmit()) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is unavailable right now. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });

    if (error) {
      setError("Something went wrong. Please try again.");
    } else {
      setMessage("Check your email for a password reset link.");
    }

    setLoading(false);
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowSubmit()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setView("waitlist-joined");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!allowSubmit()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is unavailable right now. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleSubmit =
    emailStatus === "not-found"
      ? handleJoinWaitlist
      : usePassword && emailStatus === "approved"
        ? handlePasswordSignIn
        : handleSendLink;

  const buttonKey = loading
    ? "loading"
    : emailStatus === "checking"
      ? "checking"
      : emailStatus === "approved"
        ? "signin"
        : emailStatus === "not-found"
          ? "waitlist"
          : "default";

  const title =
    view === "link-sent"
      ? "Check your email"
      : view === "waitlist-joined"
        ? "You\u2019re on the list"
        : "Sign in to Mizen";

  const description =
    view === "link-sent"
      ? "We sent a sign-in link to your email"
      : view === "waitlist-joined"
        ? "We\u2019ll let you know when your spot is ready"
        : "Enter the email you were invited with";

  const Header = isMobile ? DrawerHeader : DialogHeader;
  const Title = isMobile ? DrawerTitle : DialogTitle;
  const Description = isMobile ? DrawerDescription : DialogDescription;

  return (
    <div className="p-6 sm:p-8 overflow-y-auto">
      <Header className="text-left mb-6 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={t}
          >
            <Title className="font-serif text-2xl">{title}</Title>
            <Description className="mt-1">{description}</Description>
          </motion.div>
        </AnimatePresence>
      </Header>

      <AnimatePresence mode="wait" initial={false}>
        {view === "link-sent" ? (
          <motion.div
            key="link-sent"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={t}
            className="space-y-4"
          >
            <div className="flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
              <Letter className="h-5 w-5 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-sans text-sm text-green-800 dark:text-green-300">
                  Sign-in link sent to <span className="font-medium">{email}</span>
                </p>
                <p className="font-sans text-xs text-green-600/80 dark:text-green-400/70 mt-1">
                  Click the link in the email to sign in. Check your spam folder if you don&apos;t
                  see it.
                </p>
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
            </AnimatePresence>

            <p className="font-sans text-center text-sm text-muted-foreground">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline underline-offset-2 disabled:opacity-50"
              >
                <Restart className="h-3 w-3" />
                Resend
              </button>
            </p>

            <p className="font-sans text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setView("form");
                  setEmailStatus("idle");
                  setError(null);
                }}
                className="font-semibold text-foreground hover:underline underline-offset-2"
              >
                Use a different email
              </button>
            </p>
          </motion.div>
        ) : view === "waitlist-joined" ? (
          <motion.div
            key="waitlist-joined"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={t}
            className="space-y-4"
          >
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
              <Letter className="h-5 w-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-sans text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">{email}</span> has been added to the waitlist.
                </p>
                <p className="font-sans text-xs text-blue-600/80 dark:text-blue-400/70 mt-1">
                  We&apos;ll send you an invite when your spot opens up.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={t}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {(process.env.NODE_ENV === "development" ||
              process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") && (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 border-dashed border-amber-500/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={handleDevSignIn}
                disabled={loading}
              >
                <Login className="h-4 w-4" />
                Dev sign in
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleGoogleAuth}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 font-sans text-muted-foreground">or</span>
              </div>
            </div>

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
                onChange={(e) => handleEmailChange(e.target.value)}
                autoComplete="email"
                spellCheck={false}
              />
            </div>

            <AnimatePresence>
              {usePassword && emailStatus === "approved" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="beta-auth-password"
                      className="font-sans text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
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
                </motion.div>
              )}
              {emailStatus === "not-found" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="font-sans text-sm text-muted-foreground"
                >
                  This email isn&apos;t part of the beta yet. Join the waitlist to get access.
                </motion.p>
              )}
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
              disabled={loading || emailStatus === "checking" || emailStatus === "idle"}
              className="w-full relative overflow-hidden bg-mizen-blue hover:bg-mizen-blue/90 focus-visible:ring-mizen-blue/50"
              size="lg"
              style={{ color: "white" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={buttonKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={t}
                  className="flex items-center justify-center gap-2"
                >
                  {loading || emailStatus === "checking" ? (
                    <Spinner />
                  ) : emailStatus === "approved" ? (
                    <>
                      <Login className="h-4 w-4" />
                      Sign in
                    </>
                  ) : emailStatus === "not-found" ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Join waitlist
                    </>
                  ) : (
                    <>
                      <Letter className="h-4 w-4" />
                      Continue
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {view === "form" && emailStatus === "approved" && (
        <p className="mt-4 font-sans text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setUsePassword(!usePassword);
              setPassword("");
              setShowPassword(false);
              setError(null);
              setMessage(null);
            }}
            className="font-semibold text-foreground hover:underline underline-offset-2"
          >
            {usePassword ? "Use magic link instead" : "Use password instead"}
          </button>
        </p>
      )}

      {view === "form" && emailStatus !== "approved" && (
        <p className="mt-4 font-sans text-center text-xs text-muted-foreground">
          Mizen is in private beta. You need an invite to sign in.
        </p>
      )}
    </div>
  );
}
