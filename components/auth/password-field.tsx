"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PasswordFieldLabels = {
  show: string;
  hide: string;
};

type PasswordFieldProps = {
  id: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
  labels: PasswordFieldLabels;
};

export function PasswordField({
  id,
  name,
  autoComplete,
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
  labels,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const toggleId = useId();

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn("h-11 pr-11", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        id={toggleId}
        className="absolute top-1/2 right-1.5 size-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
        disabled={disabled}
        aria-pressed={visible}
        aria-controls={id}
        aria-label={visible ? labels.hide : labels.show}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}
