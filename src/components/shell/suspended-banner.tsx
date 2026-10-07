import { PauseCircleIcon } from "@phosphor-icons/react/ssr";

/** A suspended studio is read-only (enforced in the database); this says so before anyone hits an error. */
export function SuspendedBanner() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-pen px-4 py-2 text-center text-sm font-medium text-white">
      <PauseCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden="true" />
      This studio is suspended. Everything stays viewable, but changes are paused.
    </div>
  );
}
