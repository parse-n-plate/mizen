"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [duration] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300
  );

  // Calculate scale so the image fits within 85% of the viewport
  const scale = Math.min(
    (window.innerWidth * 0.85) / sourceRect.width,
    (window.innerHeight * 0.85) / sourceRect.height
  );

  // Translation to move the image center to the viewport center
  const translateX = window.innerWidth / 2 - (sourceRect.left + sourceRect.width / 2);
  const translateY = window.innerHeight / 2 - (sourceRect.top + sourceRect.height / 2);

  // Hide the source thumbnail while lightbox is open
  useEffect(() => {
    const el = sourceElRef.current;
    el.style.visibility = "hidden";
    return () => {
      el.style.visibility = "";
    };
  }, []);

  // Double rAF: first frame paints the element at source position,
  // second frame triggers the transition to the scaled state
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    setActive(false);
    const timeout = setTimeout(onClose, duration);
    return () => clearTimeout(timeout);
  }, [onClose, duration]);

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
      className="fixed inset-0 z-50"
      onClick={handleClose}
    >
      {/* Backdrop — bg-color + blur transition together */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: active ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0)",
          backdropFilter: active ? "blur(4px)" : "blur(0px)",
          WebkitBackdropFilter: active ? "blur(4px)" : "blur(0px)",
          transition: `background-color ${duration}ms cubic-bezier(0.165, 0.84, 0.44, 1), backdrop-filter ${duration}ms cubic-bezier(0.165, 0.84, 0.44, 1), -webkit-backdrop-filter ${duration}ms cubic-bezier(0.165, 0.84, 0.44, 1)`,
        }}
      />
      {/* Image — scales from thumbnail position to viewport center */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="fixed rounded-[10px] object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          top: sourceRect.top,
          left: sourceRect.left,
          width: sourceRect.width,
          height: sourceRect.height,
          transformOrigin: "center center",
          transform: active
            ? `translate(${translateX}px, ${translateY}px) scale(${scale})`
            : "translate(0, 0) scale(1)",
          transition: `transform ${duration}ms cubic-bezier(0.165, 0.84, 0.44, 1)`,
          willChange: "transform",
        }}
      />
    </div>,
    document.body
  );
}
