"use client";

import {
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";

export function ImageLightbox({
  src,
  alt,
  sourceRect,
  sourceEl,
  onClose,
}: {
  src: string;
  alt: string;
  sourceRect: DOMRect;
  sourceEl: HTMLElement;
  onClose: () => void;
}) {
  const [active, setActive] = useState(false);
  const sourceElRef = useRef(sourceEl);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRestoredRef = useRef(false);
  const borderRadius = 10;
  const [duration] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240
  );
  const easing = "cubic-bezier(0.23, 1, 0.32, 1)";

  const imageTransform = useMemo(() => {
    const scale = Math.min(
      (window.innerWidth * 0.85) / sourceRect.width,
      (window.innerHeight * 0.85) / sourceRect.height
    );
    const expandedWidth = sourceRect.width * scale;
    const expandedHeight = sourceRect.height * scale;
    const expandedLeft = window.innerWidth / 2 - expandedWidth / 2;
    const expandedTop = window.innerHeight / 2 - expandedHeight / 2;
    const translateX = expandedLeft - sourceRect.left;
    const translateY = expandedTop - sourceRect.top;

    return active
      ? `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`
      : "translate3d(0, 0, 0) scale(1)";
  }, [active, sourceRect]);

  const restoreSource = useCallback(() => {
    if (sourceRestoredRef.current) {
      return;
    }
    sourceElRef.current.style.visibility = "";
    sourceRestoredRef.current = true;
  }, []);

  // Hide before paint so the clone replaces the thumbnail without a duplicate frame.
  useLayoutEffect(() => {
    const el = sourceElRef.current;
    sourceRestoredRef.current = false;
    el.style.visibility = "hidden";
    return restoreSource;
  }, [restoreSource]);

  // Double rAF: first frame paints the element at source position,
  // second frame triggers the transition to the scaled state
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) {
      return;
    }

    setActive(false);
    closeTimerRef.current = setTimeout(() => {
      restoreSource();
      onClose();
    }, duration);
  }, [onClose, duration, restoreSource]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const stopLightboxEvent = useCallback((e: MouseEvent | PointerEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
  }, []);

  const handleRootClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      stopLightboxEvent(e);
      handleClose();
    },
    [handleClose, stopLightboxEvent]
  );

  const handleRootPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      stopLightboxEvent(e);
    },
    [stopLightboxEvent]
  );

  const handleImageClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      stopLightboxEvent(e);
      handleClose();
    },
    [handleClose, stopLightboxEvent]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 cursor-zoom-out"
      onClick={handleRootClick}
      onPointerDown={handleRootPointerDown}
    >
      {/* Backdrop — bg-color + blur transition together */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: active ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0)",
          transition: `background-color ${duration}ms ${easing}`,
        }}
      />
      {/* Image — scales from thumbnail position to viewport center */}
      <div
        className="fixed overflow-hidden shadow-2xl"
        onClick={handleImageClick}
        style={{
          top: sourceRect.top,
          left: sourceRect.left,
          width: sourceRect.width,
          height: sourceRect.height,
          transform: imageTransform,
          transformOrigin: "top left",
          borderRadius,
          clipPath: `inset(0 round ${borderRadius}px)`,
          transition: `transform ${duration}ms ${easing}`,
          cursor: "zoom-out",
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
      </div>
    </div>,
    document.body
  );
}
