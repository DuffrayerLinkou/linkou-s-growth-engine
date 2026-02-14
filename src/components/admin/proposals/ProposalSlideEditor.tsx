import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ProposalSlide } from "./ProposalTemplates";

interface Props {
  slide: ProposalSlide;
  onChange: (updated: ProposalSlide) => void;
}

export function ProposalSlideEditor({ slide, onChange }: Props) {
  const updateTitle = (title: string) => onChange({ ...slide, title });

  const updateContent = (index: number, value: string) => {
    const content = [...slide.content];
    content[index] = value;
    onChange({ ...slide, content });
  };

  const addContent = () => onChange({ ...slide, content: [...slide.content, ""] });

  const removeContent = (index: number) => {
    onChange({ ...slide, content: slide.content.filter((_, i) => i !== index) });
  };

  const updateHighlight = (index: number, value: string) => {
    const highlights = [...(slide.highlights || [])];
    highlights[index] = value;
    onChange({ ...slide, highlights });
  };

  const addHighlight = () => onChange({ ...slide, highlights: [...(slide.highlights || []), ""] });

  const removeHighlight = (index: number) => {
    onChange({ ...slide, highlights: (slide.highlights || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Título</label>
        <Input value={slide.title} onChange={(e) => updateTitle(e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-muted-foreground">Conteúdo</label>
          <Button variant="ghost" size="sm" onClick={addContent} className="gap-1 h-7">
            <Plus className="h-3 w-3" /> Linha
          </Button>
        </div>
        <div className="space-y-2">
          {slide.content.map((line, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                value={line}
                onChange={(e) => updateContent(i, e.target.value)}
                rows={1}
                className="min-h-[36px] resize-none"
              />
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeContent(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {(slide.type !== "cover") && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted-foreground">Destaques</label>
            <Button variant="ghost" size="sm" onClick={addHighlight} className="gap-1 h-7">
              <Plus className="h-3 w-3" /> Destaque
            </Button>
          </div>
          <div className="space-y-2">
            {(slide.highlights || []).map((h, i) => (
              <div key={i} className="flex gap-2">
                <Input value={h} onChange={(e) => updateHighlight(i, e.target.value)} />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeHighlight(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
