'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { X, Settings2 } from 'lucide-react';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';

export default function Footer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { settings, toggleShowRecentRecipeImages } = useAdminSettings();

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <footer className="bg-stone-950 text-white w-full py-12 px-4 md:px-8 relative overflow-hidden rounded-t-[16px]">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left: Text and Buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-[10px]">
                <h2 className="font-domine text-[40px] md:text-[48px] font-normal leading-[1.1] text-stone-50">
                  Clean recipes,
                  <br />
                  fast cooking.
                </h2>
              </div>

              <Link
                href="/"
                className="
                  inline-flex items-center justify-center
                  bg-stone-900 text-stone-50
                  font-albert font-medium text-[16px] leading-[1.4] px-5 py-2 rounded-full
                  hover:bg-stone-800 transition-all duration-200
                  w-fit
                "
              >
                Find Recipe
              </Link>

              <p className="font-albert text-[14px] md:text-[16px] leading-none text-stone-50">
                © Parse and Plate 2025
              </p>
            </div>

            {/* Right: Fish Logo Illustration */}
            <div className="flex-shrink-0 absolute right-0 top-0 bottom-0 md:relative md:static">
              <div className="w-32 h-32 md:w-40 md:h-40 relative">
                <Image
                  src="/assets/icons/fish logo.svg"
                  alt="Parse and Plate Logo"
                  fill
                  className="object-contain opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Drawer */}
      {isDrawerOpen && (
        <div
          className="admin-drawer-overlay"
          role="presentation"
          onClick={closeDrawer}
        >
          <div
            className="admin-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Admin settings"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500 font-semibold">
                  Admin
                </p>
                <h3 className="font-domine text-[28px] text-stone-900 leading-[1.1]">
                  Settings & toggles
                </h3>
                <p className="font-albert text-sm text-stone-600 mt-1">
                  Quick switches to test UI behaviors. Changes save locally.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close settings drawer"
                onClick={closeDrawer}
                className="admin-drawer-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-stone-200">
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-domine text-lg text-stone-900 leading-[1.2]">
                    Recent recipe images
                  </p>
                  <p className="font-albert text-sm text-stone-600">
                    Toggle image slots on recent recipe cards. Turn off to see the
                    cards without image frames.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showRecentRecipeImages}
                  onClick={toggleShowRecentRecipeImages}
                  className={`admin-toggle ${settings.showRecentRecipeImages ? 'is-on' : ''}`}
                >
                  <span className="admin-toggle-handle" />
                </button>
              </div>
              <div className="py-4 flex items-center justify-end">
                <Link
                  href="/admin/debug-parser"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 text-sm font-medium"
                >
                  <Settings2 className="w-4 h-4" />
                  Admin tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating settings tab */}
      <button
        type="button"
        aria-label="Open settings"
        className="admin-settings-tab"
        onClick={() => setIsDrawerOpen(true)}
      >
        <Settings2 className="w-4 h-4" />
      </button>
    </>
  );
}

