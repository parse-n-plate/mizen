"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Sign in
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="font-sans text-sm text-stone-500">
            Authentication is not configured yet. Connect Supabase to enable sign in.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
