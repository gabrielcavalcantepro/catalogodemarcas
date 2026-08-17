"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Calendar (react-day-picker) não participa de FormData sozinho — mantém
// um input escondido em "yyyy-MM-dd", mesmo formato que a action já espera
// de um <input type="date"> nativo, então o lado do servidor não muda.
export function FormDateField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? new Date(`${defaultValue}T00:00:00`) : undefined,
  );

  return (
    <>
      <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />
      <Popover>
        <PopoverTrigger className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-graphite bg-charcoal px-5 py-3 text-left text-sm text-paper transition-colors duration-150 hover:border-mist">
          <CalendarIcon size={16} strokeWidth={1.75} />
          {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} />
        </PopoverContent>
      </Popover>
    </>
  );
}
