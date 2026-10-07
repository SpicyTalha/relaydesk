"use client";

import { PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="rounded-full">
      <PrinterIcon />
      Print or save as PDF
    </Button>
  );
}
