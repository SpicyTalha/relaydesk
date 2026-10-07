"use client";

import { useId, useRef, useState } from "react";
import { CloudArrowUpIcon, FileIcon, FileTextIcon, FilmStripIcon, ImageIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE, ALLOWED_MIME_TYPES, maxUploadBytes, previewKind } from "@/lib/uploads";
import { fileMimeType } from "@/lib/upload-client";
import { formatBytes } from "@/lib/format";

const KIND_ICON = { image: ImageIcon, pdf: FileTextIcon, video: FilmStripIcon, file: FileIcon } as const;

export function Dropzone({
  file,
  onFile,
  isDemo = false,
  disabled = false,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  isDemo?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = maxUploadBytes(isDemo);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    if (!ALLOWED_MIME_TYPES.has(fileMimeType(candidate))) {
      setError("That file type isn't supported. Use an image, PDF, video, or an Office, Figma or ZIP file.");
      return;
    }
    if (candidate.size > limit) {
      setError(`That file is ${formatBytes(candidate.size)}. The limit is ${formatBytes(limit)}${isDemo ? " in the demo" : ""}.`);
      return;
    }
    setError(null);
    onFile(candidate);
  }

  if (file) {
    const Icon = KIND_ICON[previewKind(fileMimeType(file))];
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground tabular">{formatBytes(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => {
            onFile(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          aria-label="Remove file"
        >
          <XIcon />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <CloudArrowUpIcon className={cn("size-7", dragging ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
        <span className="text-sm font-medium">
          Drop a file here, or <span className="text-primary">browse</span>
        </span>
        <span className="text-xs text-muted-foreground">Images, PDF, video, Office, Figma or ZIP. Up to {formatBytes(limit)}.</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
