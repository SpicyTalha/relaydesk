import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoStage } from "./stage";

export const metadata: Metadata = { title: "Video", robots: { index: false } };

/** The launch video, drawn frame by frame from the product's own components. Development only. */
export default function VideoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <VideoStage />;
}
