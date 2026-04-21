import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

type OversizedDividerProps = {
  topLine: string;
  bottomLine: string;
  /** Highlight word from bottomLine to wrap in primary color */
  highlight?: string;
};

/**
 * Editorial section divider with viewport-dominant typography.
 * Two lines: a quiet top line + a massive bottom statement.
 */
function OversizedDividerComponent({ topLine, bottomLine, highlight }: OversizedDividerProps) {
  const prefersReducedMotion = useReducedMotion();

  const renderBottom = () => {
    if (!highlight) return bottomLine;
    const parts = bottomLine.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="text-primary">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <section className="relative py-24 md:py-40 overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="block text-primary font-semibold text-sm uppercase tracking-[0.3em] mb-6 md:mb-10"
        >
          {topLine}
        </motion.span>

        <motion.h2
          initial={prefersReducedMotion ? false : { opacity: 0, clipPath: "inset(100% 0 0 0)" }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, clipPath: "inset(0% 0 0 0)" }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-bold leading-[0.95] tracking-tight text-balance text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[10rem]"
        >
          {renderBottom()}
        </motion.h2>
      </div>
    </section>
  );
}

export const OversizedDivider = memo(OversizedDividerComponent);