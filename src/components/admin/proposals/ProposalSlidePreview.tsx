import { useRef, useEffect, useState } from "react";
import { Check, Target, Lightbulb, ListChecks, DollarSign, ArrowRight, Building2 } from "lucide-react";
import type { ProposalSlide } from "./ProposalTemplates";
import logoRoxo from "@/assets/logo-linkou-horizontal-roxo.png";

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const typeIcons: Record<string, React.ReactNode> = {
  diagnostic: <Target className="w-12 h-12" />,
  solution: <Lightbulb className="w-12 h-12" />,
  scope: <ListChecks className="w-12 h-12" />,
  investment: <DollarSign className="w-12 h-12" />,
  next_steps: <ArrowRight className="w-12 h-12" />,
  about: <Building2 className="w-12 h-12" />,
};

interface Props {
  slide: ProposalSlide;
  clientName: string;
  proposalTitle: string;
  slideIndex: number;
  totalSlides: number;
  className?: string;
}

export function ProposalSlidePreview({ slide, clientName, proposalTitle, slideIndex, totalSlides, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setScale(Math.min(width / SLIDE_W, height / SLIDE_H));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderContent = () => {
    if (slide.type === "cover") {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-12 px-40">
          <img src={logoRoxo} alt="Linkou" className="h-20 object-contain" />
          <h1 className="text-7xl font-bold text-white leading-tight">{proposalTitle || slide.title}</h1>
          <p className="text-4xl text-white/80">{clientName}</p>
          <p className="text-2xl text-white/60">{new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full px-24 py-20">
        {/* Header */}
        <div className="flex items-center gap-6 mb-16">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            {typeIcons[slide.type] || <ListChecks className="w-12 h-12" />}
          </div>
          <h2 className="text-6xl font-bold text-white">{slide.title}</h2>
        </div>

        {/* Body */}
        <div className="flex-1 flex gap-16">
          <div className="flex-1 space-y-8">
            {slide.content.map((line, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="w-3 h-3 rounded-full bg-purple-300 mt-4 shrink-0" />
                <p className="text-3xl text-white/90 leading-relaxed">{line}</p>
              </div>
            ))}
          </div>

          {slide.highlights && slide.highlights.length > 0 && (
            <div className="w-[500px] bg-white/10 rounded-3xl p-12 space-y-6">
              <p className="text-2xl font-semibold text-purple-200 uppercase tracking-wider mb-4">Destaques</p>
              {slide.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Check className="w-8 h-8 text-green-400 shrink-0" />
                  <p className="text-2xl text-white">{h}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-auto">
          <img src={logoRoxo} alt="Linkou" className="h-8 opacity-50 invert brightness-200" />
          <p className="text-xl text-white/40">{slideIndex + 1} / {totalSlides}</p>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden bg-black ${className ?? ""}`} style={{ aspectRatio: "16/9" }}>
      <div
        className="absolute origin-top-left"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          background: slide.type === "cover"
            ? "linear-gradient(135deg, #1a1a2e 0%, #7C3AED 50%, #4C1D95 100%)"
            : "linear-gradient(180deg, #1a1a2e 0%, #2d1b69 100%)",
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
