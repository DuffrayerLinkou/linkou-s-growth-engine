import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { forwardRef, useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";

interface RippleEffect {
  id: number;
  x: number;
  y: number;
}

interface AnimatedCTAProps {
  children: React.ReactNode;
  size?: "default" | "lg" | "sm";
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const AnimatedCTA = forwardRef<HTMLButtonElement, AnimatedCTAProps>(
  ({ children, className, size = "lg", variant = "primary", onClick, type = "button", disabled, ...props }, ref) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    // Mouse tracking for 3D tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const springConfig = { stiffness: 300, damping: 20 };
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig);

    const handleMouseMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) / rect.width);
      y.set((e.clientY - centerY) / rect.height);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const rippleX = e.clientX - rect.left;
      const rippleY = e.clientY - rect.top;
      
      const newRipple: RippleEffect = {
        id: Date.now(),
        x: rippleX,
        y: rippleY,
      };
      
      setRipples((prev) => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
      
      onClick?.(e);
    };

    const sizeClasses = {
      sm: "h-9 px-4 text-sm",
      default: "h-10 px-6 text-sm",
      lg: "h-12 px-8 text-base",
    };

    const variantClasses = {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "bg-transparent border-2 border-primary text-primary",
    };

    return (
      <motion.button
        ref={(node) => {
          // Handle both refs
          (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "relative overflow-hidden rounded-lg font-semibold",
          "transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        style={{
          perspective: 1000,
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        type={type}
        disabled={disabled}
        whileHover={disabled ? undefined : { 
          scale: 1.02,
          boxShadow: variant === "primary" 
            ? "0 0 30px hsl(var(--primary) / 0.4), 0 10px 40px -10px hsl(var(--primary) / 0.3)"
            : "0 10px 30px -10px hsl(var(--foreground) / 0.2)"
        }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: variant === "primary"
              ? "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--primary)) 100%)"
              : "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--secondary) / 0.8) 50%, hsl(var(--secondary)) 100%)",
            backgroundSize: "200% 200%",
          }}
          whileHover={{ 
            opacity: 1,
            backgroundPosition: ["0% 0%", "100% 100%"]
          }}
          transition={{ duration: 0.6 }}
        />

        {/* Shimmer Effect on Hover */}
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsl(var(--background) / 0.3) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          whileHover={{
            opacity: 1,
            backgroundPosition: ["200% 0%", "-200% 0%"],
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Glow Ring */}
        <motion.div
          className="absolute -inset-1 rounded-lg opacity-0 blur-md"
          style={{
            background: "hsl(var(--primary) / 0.5)",
          }}
          whileHover={{ opacity: 0.6 }}
          transition={{ duration: 0.3 }}
        />

        {/* Ripple Effects */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              background: "hsl(var(--background) / 0.4)",
              transform: "translate(-50%, -50%)",
            }}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

AnimatedCTA.displayName = "AnimatedCTA";
