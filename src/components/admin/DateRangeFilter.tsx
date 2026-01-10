import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DatePreset = {
  label: string;
  value: string;
  getRange: () => DateRange;
};

const presets: DatePreset[] = [
  {
    label: "Hoje",
    value: "today",
    getRange: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: "Ontem",
    value: "yesterday",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "Últimos 7 dias",
    value: "last7days",
    getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Últimos 30 dias",
    value: "last30days",
    getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "Este mês",
    value: "thisMonth",
    getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: "Mês passado",
    value: "lastMonth",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    label: "Este trimestre",
    value: "thisQuarter",
    getRange: () => ({ from: startOfQuarter(new Date()), to: new Date() }),
  },
  {
    label: "Trimestre passado",
    value: "lastQuarter",
    getRange: () => {
      const lastQuarter = subQuarters(new Date(), 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    },
  },
  {
    label: "Este ano",
    value: "thisYear",
    getRange: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
];

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  selectedPreset,
  onPresetChange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: DatePreset) => {
    onPresetChange(preset.value);
    onDateRangeChange(preset.getRange());
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    onPresetChange("custom");
    onDateRangeChange(range);
  };

  const getDisplayLabel = () => {
    if (selectedPreset === "custom" && dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yy", { locale: ptBR })}`;
      }
      return format(dateRange.from, "dd/MM/yy", { locale: ptBR });
    }
    const preset = presets.find((p) => p.value === selectedPreset);
    return preset?.label || "Selecionar período";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between min-w-[200px] font-normal",
            !dateRange && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{getDisplayLabel()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r p-2 space-y-1 min-w-[140px]">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => {
                  handlePresetClick(preset);
                  setIsOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
            <div className="border-t my-2" />
            <Button
              variant={selectedPreset === "custom" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => onPresetChange("custom")}
            >
              Personalizado
            </Button>
          </div>
          
          {/* Calendar */}
          <div className="p-2">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
              locale={ptBR}
            />
            <div className="flex justify-end gap-2 p-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { presets };
