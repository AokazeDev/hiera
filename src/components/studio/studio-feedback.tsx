"use client";

import { Check } from "lucide-react";

type StudioFeedbackProps = {
  id: number;
  message: string;
};

export function StudioFeedback({ id, message }: StudioFeedbackProps) {
  return (
    <output key={id} className="studio-feedback" aria-live="polite">
      <Check size={15} aria-hidden="true" />
      <span>{message}</span>
    </output>
  );
}
