"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Image as ImageIcon, FileText, Film } from "lucide-react";

export type UploadedFile = {
  id: string;
  name: string;
  type: string; // MIME
  size: number;
  base64: string; // for sending to AI
  previewUrl: string; // for UI preview
};

const MAX_FILES = 4;
const MAX_SIZE_MB = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FileUploadButton({
  onFilesChange,
  files,
  disabled,
}: {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (files.length + fileList.length > MAX_FILES) {
      toast.error(`الحدّ الأقصى ${MAX_FILES} ملفات`);
      return;
    }

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`الملف "${file.name}" أكبر من ${MAX_SIZE_MB}MB`);
        continue;
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`الملف "${file.name}" ليس صورة أو فيديو`);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
          previewUrl: URL.createObjectURL(file),
        });
      } catch {
        toast.error(`تعذّر قراءة ${file.name}`);
      }
    }

    setUploading(false);
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title="رفع صور أو فيديو"
        aria-label="رفع ملف"
      >
        <Paperclip className="size-4" />
      </Button>
    </>
  );
}

export function FilePreviewList({
  files,
  onRemove,
}: {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2 px-1">
      {files.map((f) => {
        const isImage = f.type.startsWith("image/");
        const isVideo = f.type.startsWith("video/");
        return (
          <div
            key={f.id}
            className="relative group rounded-lg border bg-card overflow-hidden"
            style={{ width: 80, height: 80 }}
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" />
            ) : isVideo ? (
              <div className="w-full h-full grid place-items-center bg-muted text-muted-foreground">
                <Film className="size-6" />
              </div>
            ) : (
              <div className="w-full h-full grid place-items-center bg-muted text-muted-foreground">
                <FileText className="size-6" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(f.id)}
              className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="حذف"
            >
              <X className="size-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate flex items-center gap-1">
              {isImage ? <ImageIcon className="size-2.5" /> : isVideo ? <Film className="size-2.5" /> : <FileText className="size-2.5" />}
              <span className="truncate">{f.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
