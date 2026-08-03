import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <Image
        src="/brand/arch-compass.webp"
        alt=""
        aria-hidden
        width={160}
        height={160}
        className="rounded-2xl opacity-90"
      />
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-primary">404</span>
        <h1 className="text-2xl font-bold sm:text-3xl">Lost in Tamriel</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          No wayshrine answers here — this page doesn&apos;t exist, or a patch swept it away.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Travel to the nearest wayshrine</Link>
      </Button>
    </div>
  );
}
