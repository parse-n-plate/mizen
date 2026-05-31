"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SPLASH_SESSION_KEY = "mizen:splash-seen";
const MIN_VISIBLE_MS = 900;
const MAX_VISIBLE_MS = 1800;
const REDUCED_MOTION_VISIBLE_MS = 250;

const ANIMATION_PARAMS = {
  height: 42,
  duration: 0.55,
  stagger: 0.14,
  tilt: 7,
  overshoot: 0.56,
  squash: 0.5,
} as const;

const springUp = [0.34, 1 + ANIMATION_PARAMS.overshoot * 0.9, 0.64, 1] as const;
const springDown = [0.22, 1, 0.36, 1] as const;

const scaleXPeak = 1 - ANIMATION_PARAMS.squash * 0.22;
const scaleYPeak = 1 + ANIMATION_PARAMS.squash * 0.22;
const scaleXLand = 1 + ANIMATION_PARAMS.squash * 0.08;
const scaleYLand = 1 - ANIMATION_PARAMS.squash * 0.1;

const icons = [
  {
    src: "/assets/splash/tomato.png",
    alt: "Tomato",
    clipStyle: { overflow: "hidden" },
    imgStyle: {
      position: "absolute" as const,
      left: "-130.72%",
      width: "245.65%",
      height: "245.65%",
      top: "-13.66%",
    },
  },
  {
    src: "/assets/splash/tomato-slice.png",
    alt: "Tomato slice",
    clipStyle: {},
    imgStyle: {
      position: "absolute" as const,
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover" as const,
      objectPosition: "bottom",
    },
  },
  {
    src: "/assets/splash/tomato-half.png",
    alt: "Tomato half",
    clipStyle: { overflow: "hidden" },
    imgStyle: {
      position: "absolute" as const,
      left: "-100.77%",
      width: "308.45%",
      height: "308.45%",
      top: "-103.49%",
    },
  },
  {
    src: "/assets/splash/pan.png",
    alt: "Pan",
    clipStyle: { overflow: "hidden" },
    imgStyle: {
      position: "absolute" as const,
      left: "-102.48%",
      width: "308.45%",
      height: "308.45%",
      top: "-199.74%",
    },
  },
] as const;

function getAnimation(index: number) {
  const tiltDir = index % 2 === 0 ? -1 : 1;
  const tilt = tiltDir * ANIMATION_PARAMS.tilt;

  return {
    animate: {
      y: [0, -ANIMATION_PARAMS.height, ANIMATION_PARAMS.height * 0.05, 0],
      scaleX: [1, scaleXPeak, scaleXLand, 1],
      scaleY: [1, scaleYPeak, scaleYLand, 1],
      rotate: [0, tilt, 0, 0],
    },
    transition: {
      repeat: Infinity,
      repeatDelay: icons.length * ANIMATION_PARAMS.stagger + 0.6,
      delay: index * ANIMATION_PARAMS.stagger,
      duration: ANIMATION_PARAMS.duration,
      times: [0, 0.38, 0.72, 1],
      ease: [springUp, springDown, springDown],
    },
  };
}

function SplashIcons({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className="flex items-end gap-6"
      data-splash-icons="true"
      style={{ width: 552, maxWidth: "none" }}
      aria-hidden="true"
    >
      {icons.map((icon, index) => {
        const { animate, transition } = getAnimation(index);

        return (
          <motion.div
            key={icon.src}
            className="relative shrink-0"
            data-splash-icon="true"
            style={{ width: 120, height: 120, originX: "50%", originY: "100%" }}
            animate={reduceMotion ? undefined : animate}
            transition={reduceMotion ? undefined : transition}
          >
            <div className="absolute inset-0" style={icon.clipStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={icon.alt}
                src={icon.src}
                draggable={false}
                style={{ maxWidth: "none", ...icon.imgStyle }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function SplashScreen({ enabled, ready }: { enabled: boolean; ready: boolean }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    try {
      if (sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") {
        return;
      }
      sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    } catch {
      // If storage is unavailable, still show the launch polish once for this mount.
    }

    const showTimer = window.setTimeout(() => setVisible(true), 0);

    const minimumTimer = window.setTimeout(
      () => setMinimumElapsed(true),
      reduceMotion ? REDUCED_MOTION_VISIBLE_MS : MIN_VISIBLE_MS
    );
    const maximumTimer = window.setTimeout(() => setVisible(false), MAX_VISIBLE_MS);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
    };
  }, [enabled, reduceMotion]);

  useEffect(() => {
    if (!visible || !ready || !minimumElapsed) return;
    const dismissTimer = window.setTimeout(() => setVisible(false), 0);
    return () => window.clearTimeout(dismissTimer);
  }, [minimumElapsed, ready, visible]);

  return (
    <AnimatePresence>
      {enabled && visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#fafaf9] dark:bg-stone-950"
          data-splash-screen="true"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 1 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.18, ease: "easeOut" }}
        >
          <div className="origin-center scale-[0.56] min-[480px]:scale-75 md:scale-100">
            <SplashIcons reduceMotion={!!reduceMotion} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
