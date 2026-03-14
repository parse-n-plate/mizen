"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSubmitGuard } from "@/hooks/useSubmitGuard";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
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
import Letter from "@solar-icons/react/csr/messages/Letter";
import Restart from "@solar-icons/react/csr/arrows/Restart";
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
  const shouldReduceMotion = useReducedMotion();
  const t = shouldReduceMotion ? INSTANT : TRANSITION;

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      // Fail open — let the OTP call handle it
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

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      if (closeResetTimeoutRef.current) {
        clearTimeout(closeResetTimeoutRef.current);
      }
      closeResetTimeoutRef.current = setTimeout(() => {
        if (openRef.current) return;
        setEmail("");
        setError(null);
        setEmailStatus("idle");
        setView("form");
        setLoading(false);
      }, 200);
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleSubmit = emailStatus === "not-found" ? handleJoinWaitlist : handleSendLink;

  // Determine button label
  const buttonKey = loading
    ? "loading"
    : emailStatus === "checking"
      ? "checking"
      : emailStatus === "approved"
        ? "signin"
        : emailStatus === "not-found"
          ? "waitlist"
          : "default";

  // Title / description per view
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-xl">
        <div className="p-8 sm:p-10">
          <DialogHeader className="text-left mb-6 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={t}
              >
                <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
                <DialogDescription className="mt-1">{description}</DialogDescription>
              </motion.div>
            </AnimatePresence>
          </DialogHeader>

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
                      Click the link in the email to sign in. Check your spam folder if you don&apos;t see it.
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
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={loading || emailStatus === "checking" || emailStatus === "idle"}
                  className="w-full relative overflow-hidden bg-mizen-blue hover:bg-mizen-blue/90 focus-visible:ring-mizen-blue/50"
                  style={{ color: "white" }}
                  size="lg"
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

          {view === "form" && (
            <p className="mt-4 font-sans text-center text-xs text-muted-foreground">
              Mizen is in private beta. You need an invite to sign in.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
