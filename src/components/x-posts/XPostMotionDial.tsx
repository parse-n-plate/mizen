"use client";

import { useEffect, useRef } from "react";
import { useDialKit } from "dialkit";
import { STICKER_MOTION_DEFAULTS as D, type StickerMotionConfig } from "@/lib/x-post-motion";

/**
 * DialKit panel for the animated "Stickers" X post. Loaded only in local dev
 * and Vercel preview/staging builds (the same gate as the homepage note dial).
 */
export default function XPostMotionDial({
  onConfigChange,
  onReplay,
}: {
  onConfigChange: (config: StickerMotionConfig) => void;
  onReplay: () => void;
}) {
  const values = useDialKit(
    "X post stickers",
    {
      card: {
        cardDuration: [D.cardDuration, 0.2, 2, 0.05],
        cardDistance: [D.cardDistance, 0, 80, 1],
      },
      entrance: {
        stickerDelay: [D.stickerDelay, 0, 1.5, 0.05],
        stickerStagger: [D.stickerStagger, 0.03, 0.3, 0.01],
        stickerDuration: [D.stickerDuration, 0.2, 1.5, 0.05],
        stickerStartScale: [D.stickerStartScale, 0.5, 1, 0.01],
        playEntrance: D.playEntrance,
      },
      float: {
        floatAmplitude: [D.floatAmplitude, 0, 20, 0.5],
        floatCycles: [D.floatCycles, 1, 6, 1],
        wobble: [D.wobble, 0, 12, 0.5],
      },
      look: {
        stickerScale: [D.stickerScale, 0.5, 1.8, 0.05],
        strokeWidth: [D.strokeWidth, 0, 8, 0.5],
      },
      video: {
        videoLength: [D.videoLength, 2, 15, 0.5],
        fps: [D.fps, 24, 60, 6],
      },
      replay: { type: "action", label: "Replay" },
    },
    {
      onAction: (action) => {
        if (action === "replay") onReplay();
      },
    }
  );

  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  });

  const { card, entrance, float, look, video } = values;
  useEffect(() => {
    onConfigChangeRef.current({ ...card, ...entrance, ...float, ...look, ...video });
  }, [card, entrance, float, look, video]);

  return null;
}
