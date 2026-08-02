import { cookies } from "next/headers";
import type { Platform } from "@/lib/types";
import { PLATFORM_COOKIE } from "@/lib/platform";

export async function getPlatform(): Promise<Platform> {
  const store = await cookies();
  return store.get(PLATFORM_COOKIE)?.value === "console" ? "console" : "pc";
}
