"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Wrapper fino sobre o Select do shadcn (Base UI por baixo) — participa de
// FormData nativamente via `name` (Base UI renderiza um input escondido
// pra isso), então as server actions que já leem `formData.get(name)`
// não precisam mudar nada.
export function FormSelect({
  name,
  defaultValue,
  value,
  onValueChange,
  placeholder = "Selecione...",
  required,
  disabled,
  options,
}: {
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      name={name}
      items={options}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(v) => onValueChange?.(v ?? "")}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger className="w-full bg-graphite">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
