'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { validateImageFile } from '@/lib/imageUtils';
import { ArrowLeftIcon, ImageIcon, XIcon, SendIcon } from 'lucide-react';
import Bug from '@solar-icons/react/csr/it/Bug';
import Lightbulb from '@solar-icons/react/csr/devices/Lightbulb';
import ChatRoundLine from '@solar-icons/react/csr/messages/ChatRoundLine';
import Confetti from '@solar-icons/react/csr/ui/Confetti';

type FeedbackType = 'Bug Report' | 'Feature Idea' | 'User Feedback';

const CATEGORIES: { type: FeedbackType; icon: React.ComponentType<{ className?: string }>; subtitle: string; responseHint: string }[] = [
  { type: 'Bug Report', icon: Bug, subtitle: 'Something isn\'t working correctly', responseHint: 'We\'ll look into this right away' },
  { type: 'Feature Idea', icon: Lightbulb, subtitle: 'Suggest a new feature or improvement', responseHint: 'We love hearing new ideas' },
  { type: 'User Feedback', icon: ChatRoundLine, subtitle: 'Share your thoughts or experience', responseHint: 'Your thoughts help us improve' },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<FeedbackType>('Bug Report');
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = CATEGORIES.find(c => c.type === type)!;

  // Cmd+Enter to submit
  useEffect(() => {
    if (!open || step !== 2) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, step, message, screenshots, isSubmitting]);

  const handleSelectType = (feedbackType: FeedbackType) => {
    setType(feedbackType);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (screenshots.length + files.length > 3) {
      toast.error('Maximum 3 screenshots allowed');
      return;
    }

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }
    }

    setScreenshots(prev => [...prev, ...files].slice(0, 3));
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Upload screenshots first if any
      let screenshotUrls: string[] = [];
      if (screenshots.length > 0) {
        const formData = new FormData();
        screenshots.forEach(file => formData.append('screenshots', file));

        const uploadRes = await fetch('/api/feedback/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          toast.error('Failed to upload screenshots');
          setIsSubmitting(false);
          return;
        }

        const uploadData = await uploadRes.json();
        screenshotUrls = uploadData.urls || [];
      }

      // Submit feedback
      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          screenshotUrls,
          deviceOS: navigator.userAgent,
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
        }),
      });

      if (!feedbackRes.ok) {
        toast.error('Failed to submit feedback');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      toast.success('Thank you for your feedback!');

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch {
      toast.error('An error occurred while submitting feedback');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setType('Bug Report');
      setMessage('');
      setScreenshots([]);
      setIsSubmitting(false);
      setIsSuccess(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0 min-h-[360px]" showCloseButton={step === 1}>

        <AnimatePresence mode="wait" initial={false}>
          {/* Success State */}
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <Confetti className="size-12 text-[#0088ff] mb-4" />
              <p className="font-domine text-xl font-semibold text-stone-900 text-balance">Thank you!</p>
              <p className="font-albert text-sm text-stone-500 mt-1 text-pretty">Your feedback has been submitted.</p>
            </motion.div>
          ) : step === 1 ? (
            /* Step 1: Category Selection */
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="p-6"
            >
              <DialogHeader className="mb-5">
                <DialogTitle className="text-balance">Send us a message</DialogTitle>
                <DialogDescription className="text-pretty">We&apos;ll respond asap!</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                {CATEGORIES.map(({ type: t, icon: Icon, subtitle }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectType(t)}
                    className="flex items-center gap-3 w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-left hover:bg-stone-100 active:scale-[0.97] transition-all"
                  >
                    <Icon className="size-5 text-stone-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-albert text-sm font-semibold text-stone-900">{t}</p>
                      <p className="font-albert text-xs text-stone-500 text-pretty">{subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Step 2: Message Input */
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col min-h-[360px]"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 active:scale-[0.9] transition-all"
                  aria-label="Back"
                >
                  <ArrowLeftIcon className="size-4" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <selectedCategory.icon className="size-4 text-stone-500" />
                    <span className="font-albert text-sm font-semibold text-stone-900">{type}</span>
                  </div>
                  <p className="font-albert text-xs text-stone-400 text-pretty">{selectedCategory.responseHint}</p>
                </div>
              </div>

              {/* Message Input */}
              <div className="px-6 pt-4 pb-0 flex-1 flex flex-col">
                <Textarea
                  placeholder="Tell us more..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="flex-1 min-h-0 border-none bg-transparent px-0 py-0 focus:ring-0 resize-none placeholder-stone-400"
                  autoFocus
                />
              </div>

              {/* Screenshot Previews */}
              {screenshots.length > 0 && (
                <div className="flex gap-2 px-6 pb-2">
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative size-16 flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="size-full object-cover rounded-lg border border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-1.5 -right-1.5 size-5 bg-stone-700 text-white rounded-full flex items-center justify-center hover:bg-stone-900 transition-colors"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-6 pb-4 pt-3 border-t border-stone-100">
                {/* Attach screenshot */}
                {screenshots.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <ImageIcon className="size-4" />
                    <span className="font-albert text-xs">Attach screenshot ({screenshots.length}/3)</span>
                  </button>
                )}
                {screenshots.length >= 3 && (
                  <span className="font-albert text-xs text-stone-400">3/3 screenshots</span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex items-center gap-3">
                  <span className="font-albert text-xs text-stone-400 hidden sm:block">⌘+Enter to send</span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !message.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0088ff] text-white rounded-lg font-albert text-sm font-medium hover:bg-[#0072ff] active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <SendIcon className="size-3.5" />
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
