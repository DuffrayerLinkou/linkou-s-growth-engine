import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealTextProps = {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  /** "word" splits by spaces (recommended for headlines), "char" splits by character */
  split?: "word" | "char";
  /** Stagger delay between elements, in seconds */
  stagger?: number;
  /** Initial delay before animation starts */
  delay?: number;
  /** Translate Y starting position in px */
  yOffset?: number;
  /** Animate only once (default true) */
  once?: boolean;
};

/**
 * Editorial scroll-reveal text component.
 * Splits text into words/chars and animates each with stagger as it enters viewport.
 * Respects prefers-reduced-motion.
 */
function RevealTextComponent({
  children,
  as = "span",
  className = "",
  split = "word",
  stagger = 0.04,
  delay = 0,
  yOffset = 24,
  once = true,
}: RevealTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const tokens = useMemo(() => {
    if (split === "char") return Array.from(children);
    return children.split(/(\s+)/); // keep spaces as tokens
  }, [children, split]);

  const Tag = as as keyof JSX.IntrinsicElements;

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10% 0px" }}
      variants={container}
      style={{ display: "inline-block" }}
    >
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }
        return (
          <motion.span
            key={i}
            variants={item}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {token}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

export const RevealText = memo(RevealTextComponent);