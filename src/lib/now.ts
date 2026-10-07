import "server-only";
import { io } from "next/cache";

/**
 * The current time for request-time rendering. With Cache Components, reading the clock
 * must be preceded by io() so Next.js keeps it out of prerendered and prefetched output.
 */
export async function currentTime(): Promise<number> {
  await io();
  return Date.now();
}
