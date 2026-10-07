import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may have been deleted, or you might not have access to it. If someone sent you this link, ask them to check it.
        </p>
      </div>
      <Button asChild>
        <Link href="/w">Go to your workspace</Link>
      </Button>
    </div>
  );
}
