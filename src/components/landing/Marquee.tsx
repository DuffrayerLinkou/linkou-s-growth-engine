import { memo } from "react";

const words = [
  "Auditoria",
  "Tráfego",
  "Performance",
  "Dados",
  "Autonomia",
  "Design",
  "Consultoria",
  "Estratégia",
];

function MarqueeComponent() {
  const renderWords = () =>
    words.map((word, i) => (
      <span
        key={i}
        className={`text-3xl md:text-5xl font-bold uppercase tracking-wider mx-6 md:mx-10 whitespace-nowrap ${
          i % 2 === 0 ? "text-foreground" : "text-foreground/20"
        }`}
      >
        {word}
        <span className="text-primary mx-4 md:mx-6">·</span>
      </span>
    ));

  return (
    <div className="py-8 md:py-12 overflow-hidden border-y border-border/50 bg-muted/30">
      <div className="animate-marquee flex whitespace-nowrap">
        {renderWords()}
        {renderWords()}
      </div>
    </div>
  );
}

export const Marquee = memo(MarqueeComponent);
