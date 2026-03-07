// src/components/pages/Backgrounds/generator/PhotoUploader.tsx
import { useCallback, useRef, useState } from "react";
import { PhotographIcon, XIcon } from "@heroicons/react/solid";

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 5,
  maxSizeMB = 10,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAdd = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(files);
      const valid: File[] = [];

      for (const file of incoming) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError("Only JPEG, PNG, and WebP images are accepted.");
          continue;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`Each file must be under ${maxSizeMB}MB.`);
          continue;
        }
        valid.push(file);
      }

      const combined = [...photos, ...valid].slice(0, maxPhotos);
      onChange(combined);
    },
    [photos, onChange, maxPhotos, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) validateAndAdd(e.dataTransfer.files);
    },
    [validateAndAdd]
  );

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-gray-300 dark:border-white/20 hover:border-primary/50"
          }
        `}
      >
        <PhotographIcon className="h-10 w-10 mx-auto text-gray-400 dark:text-white/40 mb-3" />
        <p className="text-sm font-medium text-gray-700 dark:text-white/70">
          Drag & drop your photos here
        </p>
        <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
          or click to browse ({photos.length}/{maxPhotos} photos)
        </p>
        <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
          JPEG, PNG, or WebP - max {maxSizeMB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) validateAndAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-white/10"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(i);
                }}
                className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
