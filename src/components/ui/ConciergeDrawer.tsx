"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "@/components/icons";

export function ConciergeDrawer({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    // Catnose Tactile UI: Provide immediate physical feedback on tap
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(10); } catch (e) {}
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={toggleDrawer}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] shadow-[0_8px_30px_rgba(36,175,255,0.4)] flex items-center justify-center z-40 border-2 border-white"
        aria-label="AIコンシェルジュを開く"
        id="fab-concierge"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.button>

      {/* Slide-up Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 pointer-events-none"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 top-12 sm:top-24 bg-[var(--color-bg)] rounded-t-[32px] sm:max-w-md sm:mx-auto z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-[1.5px] border-[var(--color-border-light)]"
            >
              <div className="w-full flex justify-center pt-3 pb-1 shrink-0" onClick={() => setIsOpen(false)}>
                <div className="w-12 h-1.5 rounded-full bg-[var(--color-muted)]/50" />
              </div>
              <div className="flex justify-end px-4 shrink-0">
                <button
                  onClick={toggleDrawer}
                  className="w-8 h-8 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center text-[var(--color-subtle)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden rounded-b-none relative">
                 {/* Provide children inside */}
                 {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
