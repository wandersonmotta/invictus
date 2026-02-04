import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
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

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

const presets = [
  {
    label: "Últimos 7 dias",
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 14 dias",
    getValue: () => ({
      from: subDays(new Date(), 14),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 30 dias",
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: "Este mês",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Mês passado",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatRange = () => {
    if (!value?.from) return "Selecione um período";
    if (!value.to)
      return format(value.from, "dd MMM yyyy", { locale: ptBR });
    return `${format(value.from, "dd MMM", { locale: ptBR })} - ${format(
      value.to,
      "dd MMM yyyy",
      { locale: ptBR }
    )}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal text-xs sm:text-sm flex-1 sm:flex-none min-w-0",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="truncate">{formatRange()}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw]" align="end">
        <div className="flex flex-col sm:flex-row max-h-[70vh] overflow-auto">
          {/* Presets */}
          <div className="border-b sm:border-b-0 sm:border-r p-2 space-y-1 flex flex-row sm:flex-col overflow-x-auto sm:overflow-x-visible gap-1">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="whitespace-nowrap justify-start text-xs"
                onClick={() => {
                  onChange(preset.getValue());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar - single month on mobile */}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange} 
            numberOfMonths={1}
            locale={ptBR}
            className="sm:hidden"
          />
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={ptBR}
            className="hidden sm:block"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
