"use client";

import type { ButtonHTMLAttributes } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <Button
      variant="danger"
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      {...props}
    >
      <Trash2 size={16} strokeWidth={1.75} />
      {children}
    </Button>
  );
}
