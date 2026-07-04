"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Bucket = "product-images" | "shop-assets" | "review-images";

interface ImageUploaderProps {
  bucket: Bucket;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
}

export function ImageUploader({ bucket, value, onChange, maxFiles = 8, label }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");

    const remainingSlots = maxFiles - value.length;
    const selected = Array.from(files).slice(0, Math.max(remainingSlots, 0));
    if (selected.length === 0) {
      setError(`You can add up to ${maxFiles} images.`);
      return;
    }

    setUploadingCount(selected.length);

    const uploaded: string[] = [];
    for (const file of selected) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);

        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to upload image.");
          continue;
        }

        uploaded.push(data.url);
      } catch {
        setError("Something went wrong while uploading.");
      }
    }

    setUploadingCount(0);
    if (uploaded.length > 0) {
      onChange([...value, ...uploaded]);
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveTo = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, index) => (
          <div
            key={url}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            {index === 0 && (
              <span className="absolute top-1.5 left-1.5 badge badge-success text-[10px]">Cover</span>
            )}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveTo(index, -1)}
                  className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              {index < value.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveTo(index, 1)}
                  className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center"
          >
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ))}

        {value.length + uploadingCount < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand hover:border-brand transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[11px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-gray-400">
        Up to {maxFiles} photos, 5MB each. The first photo is the cover image.
      </p>
    </div>
  );
}
