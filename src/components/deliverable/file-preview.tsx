import { DownloadSimpleIcon, FileIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { previewKind } from "@/lib/uploads";

export function FilePreview({
  url,
  downloadUrl,
  fileName,
  mimeType,
  sizeBytes,
  overlay,
}: {
  url: string | null;
  downloadUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Laid on the proof itself, e.g. the approval stamp. */
  overlay?: React.ReactNode;
}) {
  const kind = previewKind(mimeType);
  // Work is reviewed the way a studio would: a proof on the cutting mat. The checkerboard shows transparency.
  const checker = "bg-white bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]";
  const paper = "relative bg-white p-2 shadow-[0_1px_0_rgb(0_0_0/0.04),0_24px_40px_-20px_rgb(0_0_0/0.6)] sm:p-2.5";

  if (!url) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-xl border bg-muted/40 text-sm text-muted-foreground">
        The file couldn&apos;t be loaded. Refresh to try again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {kind === "image" && (
        <div className="mat grid place-items-center overflow-hidden rounded-xl px-4 py-6 sm:px-10 sm:py-10">
          <div className={paper}>
            {/* Signed, short-lived URL from private storage; next/image would cache it beyond its expiry. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={fileName} className={`block max-h-[64vh] w-auto object-contain ${checker}`} />
            {overlay}
          </div>
        </div>
      )}
      {kind === "pdf" && (
        <div className="mat overflow-hidden rounded-xl p-3 sm:p-6">
          <div className={`${paper} h-[70vh] min-h-96`}>
            <iframe src={`${url}#view=FitH`} title={fileName} className="size-full" />
            {overlay}
          </div>
        </div>
      )}
      {kind === "video" && (
        <div className="relative overflow-hidden rounded-xl border bg-black">
          <video src={url} controls playsInline preload="metadata" className="mx-auto max-h-[70vh] w-full" />
          {overlay}
        </div>
      )}
      {kind === "file" && (
        <div className="relative flex flex-col items-center gap-3 rounded-xl border bg-muted/40 px-6 py-14 text-center">
          {overlay}
          <FileIcon className="size-10 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground">No preview for this file type. Download it to open.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="min-w-0 truncate">
          {fileName} <span className="ml-1.5 tabular opacity-75">{formatBytes(sizeBytes)}</span>
        </span>
        {downloadUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={downloadUrl} download={fileName}>
              <DownloadSimpleIcon />
              Download
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
