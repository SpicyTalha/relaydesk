"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function ErrorView({ reset, digest }: { reset: () => void; digest?: string }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        The page didn&apos;t load properly. It&apos;s usually temporary, so try again. Nothing you saved was lost.
      </p>
      <Button onClick={reset}>
        <ArrowClockwiseIcon />
        Try again
      </Button>
      {digest && <p className="font-mono text-xs text-muted-foreground">Reference: {digest}</p>}
    </div>
  );
}
