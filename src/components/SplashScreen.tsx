import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoRoxo from "@/assets/logo-linkou-roxo.png";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => isStandalone());
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!showSplash) return;
    const t1 = setTimeout(() => setFadeOut(true), 1800);
    const t2 = setTimeout(() => setShowSplash(false), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showSplash]);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: fadeOut ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: "#0A0A0F" }}
          >
            <motion.img
              src={logoRoxo}
              alt="Linkou"
              className="w-28 h-28 object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [1, 1.05, 1] }}
              transition={{
                opacity: { duration: 0.6 },
                scale: { duration: 1.8, times: [0, 0.5, 1], ease: "easeInOut" },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
