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
}: {
  url: string | null;
  downloadUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const kind = previewKind(mimeType);
  const frame = "relative overflow-hidden rounded-xl border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]";

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
        <div className={frame}>
          {/* Signed, short-lived URL from private storage; next/image would cache it beyond its expiry. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={fileName} className="mx-auto max-h-[70vh] w-auto object-contain" />
        </div>
      )}
      {kind === "pdf" && (
        <div className={`${frame} h-[70vh] min-h-96 bg-muted`}>
          <iframe src={`${url}#view=FitH`} title={fileName} className="size-full" />
        </div>
      )}
      {kind === "video" && (
        <div className="overflow-hidden rounded-xl border bg-black">
          <video src={url} controls playsInline preload="metadata" className="mx-auto max-h-[70vh] w-full" />
        </div>
      )}
      {kind === "file" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 px-6 py-14 text-center">
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
