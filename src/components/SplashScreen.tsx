import { useState, useEffect } from "react";
import logoRoxo from "@/assets/logo-linkou-roxo.png";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(() => isStandalone());
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (!visible) return;

    const reduced = prefersReducedMotion();
    const holdDelay = reduced ? 50 : 500;
    const outDelay = reduced ? 100 : 800;

    const t1 = setTimeout(() => setPhase("out"), holdDelay);
    const t2 = setTimeout(() => setVisible(false), outDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  return (
    <>
      {visible && (
        <div
          className="splash-overlay"
          data-phase={phase}
          aria-hidden="true"
        >
          <img
            src={logoRoxo}
            alt=""
            className="splash-logo"
            width={112}
            height={112}
          />
        </div>
      )}
      {children}
    </>
  );
}
