import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_TIMING, GigVideoStage, type Timing } from "./stage";

export const metadata: Metadata = { title: "Gig video", robots: { index: false } };

/**
 * The Fiverr gig video, drawn frame by frame. Development only. Talha's photo and the scene timing
 * are read from gallery/talha/ (git-ignored), so nothing personal ships in the repo.
 */
export default function GigVideoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const dir = path.join(process.cwd(), "gallery/talha");
  const timingFile = path.join(dir, "timing.json");
  const timing: Timing = existsSync(timingFile) ? { ...DEFAULT_TIMING, ...JSON.parse(readFileSync(timingFile, "utf8")) } : DEFAULT_TIMING;
  const photoFile = ["photo.jpg", "photo.jpeg", "photo.png"].map((f) => path.join(dir, f)).find(existsSync);
  const photo = photoFile ? `data:image/${photoFile.endsWith("png") ? "png" : "jpeg"};base64,${readFileSync(photoFile).toString("base64")}` : null;
  return <GigVideoStage timing={timing} photo={photo} />;
}
