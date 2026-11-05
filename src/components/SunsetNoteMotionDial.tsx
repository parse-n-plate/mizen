"use client";

import { useEffect, useRef } from "react";
import { useDialKit } from "dialkit";
import {
  NOTE_ENTRANCE_DEFAULTS,
  isNoteEntranceCurve,
  type NoteEntranceConfig,
} from "@/lib/sunset-note-motion";

/**
 * Development-only tuning panel for the homepage note entrance. It is loaded
 * through a NODE_ENV-gated dynamic import in SunsetHomepage, so it is not
 * part of production bundles. Changing a value does not replay; use the
 * "Replay note" action.
 */
export default function SunsetNoteMotionDial({
  onConfigChange,
  onReplay,
}: {
  onConfigChange: (config: NoteEntranceConfig) => void;
  onReplay: () => void;
}) {
  const values = useDialKit(
    "Mizen note entrance",
    {
      distance: [NOTE_ENTRANCE_DEFAULTS.distance, 0, 32, 1],
      duration: [NOTE_ENTRANCE_DEFAULTS.duration, 120, 500, 10],
      delay: [NOTE_ENTRANCE_DEFAULTS.delay, 0, 300, 10],
      initialOpacity: [NOTE_ENTRANCE_DEFAULTS.initialOpacity, 0, 1, 0.05],
      curve: {
        type: "select",
        options: [
          { value: "custom", label: "Custom (.16, 1, .3, 1)" },
          { value: "gentler", label: "Gentler (.22, 1, .36, 1)" },
          { value: "linear", label: "Linear (comparison)" },
        ],
        default: NOTE_ENTRANCE_DEFAULTS.curve,
      },
      replay: { type: "action", label: "Replay note" },
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

  const { distance, duration, delay, initialOpacity, curve } = values;
  useEffect(() => {
    onConfigChangeRef.current({
      distance,
      duration,
      delay,
      initialOpacity,
      curve: isNoteEntranceCurve(curve) ? curve : NOTE_ENTRANCE_DEFAULTS.curve,
    });
  }, [distance, duration, delay, initialOpacity, curve]);

  return null;
}
