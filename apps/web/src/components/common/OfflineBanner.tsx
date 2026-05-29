"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconWifiOff } from "@tabler/icons-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      // Show "back online" briefly
      setTimeout(() => setWasOffline(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Check initial state
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const show = isOffline || (wasOffline && !isOffline);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold ${
            isOffline
              ? "bg-destructive text-white"
              : "bg-accent text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {isOffline ? (
            <>
              <IconWifiOff className="h-4 w-4 flex-shrink-0" />
              You are offline — scores will sync when reconnected
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-background animate-pulse" />
              Back online!
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
