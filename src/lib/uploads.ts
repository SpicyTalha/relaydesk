/** File rules shared by the browser (fast feedback) and the server (the real check). */

export const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream", // .fig and other design files often arrive without a specific type
]);

export const ACCEPT_ATTRIBUTE = [
  "image/*",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  ".zip",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".fig",
].join(",");

const MB = 1024 * 1024;

/** Real workspaces get the bucket limit; demo sandboxes get a small cap. */
export function maxUploadBytes(isDemo: boolean): number {
  return isDemo ? 5 * MB : 50 * MB;
}

/**
 * Storage keys accept a limited character set. Keep names readable:
 * "Menu Board (final) v2.pdf" -> "Menu-Board-final-v2.pdf".
 */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

export type PreviewKind = "image" | "pdf" | "video" | "file";

export function previewKind(mimeType: string): PreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}
