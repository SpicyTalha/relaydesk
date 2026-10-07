"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending, data } = useFormStatus();
  // When several submit buttons share a form, only the one that was pressed shows progress.
  const isThisButton = !props.name || data?.get(props.name) === props.value;
  const showPending = pending && isThisButton;
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled} aria-disabled={pending}>
      {showPending ? (
        <>
          <Spinner />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
