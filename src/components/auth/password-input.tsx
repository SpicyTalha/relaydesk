"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

/** A password field with a show/hide toggle, so people can check what they typed on a phone. */
export function PasswordInput({
  className,
  toggleLabel = "Show password",
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type"> & { toggleLabel?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className={cn("pr-12", className)} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={toggleLabel}
        aria-pressed={shown}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {shown ? <EyeSlashIcon className="size-5" aria-hidden="true" /> : <EyeIcon className="size-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
