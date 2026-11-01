"use client";

import React, { useState, useRef } from "react";
import { uploadMachineryImage } from "@/actions/machinery/machinery-actions";

interface MachineryImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function MachineryImageUploader({
  images,
  onChange,
  maxImages = 8,
}: MachineryImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setUploadError(`Maximum ${maxImages} images allowed per machinery listing.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    // Validate MIME types and file extensions client-side first
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const blockedExtensions = [".svg", ".html", ".htm", ".js", ".exe", ".sh", ".bat", ".cmd", ".php"];

    for (const file of filesToUpload) {
      const lower = file.name.toLowerCase();
      if (blockedExtensions.some((ext) => lower.endsWith(ext))) {
        setUploadError(`File "${file.name}" is rejected. SVG, HTML, and executable files are not allowed.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File "${file.name}" is not supported. Please upload only JPG, PNG, or WebP images.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 10MB size limit.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadMachineryImage(formData);
        if (!res.success || !res.url) {
          throw new Error(res.error || `Failed to upload "${file.name}"`);
        }
        newUrls.push(res.url);
      }

      onChange([...images, ...newUrls]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload one or more images. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([item, ...remaining]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>📷 Machine Photos</span>
            <span className="text-xs font-normal text-gray-500">
              ({images.length} of {maxImages} uploaded)
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Add clear photos of the equipment. The first image will be displayed as the main cover photo.
          </p>
        </div>
        {images.length > 0 && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ✓ {images.length} Photo{images.length > 1 ? "s" : ""} Ready
          </span>
        )}
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <span className="text-base leading-none">⚠️</span>
          <div className="flex-1">{uploadError}</div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Drop Zone / Button */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="machinery-image-input"
          />
          <label
            htmlFor="machinery-image-input"
            className={`w-full border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              uploading
                ? "border-amber-400 bg-amber-50/50 cursor-wait"
                : "border-gray-300 hover:border-amber-500 hover:bg-amber-50/30 bg-gray-50/60"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-xl mb-3">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                "➕"
              )}
            </div>
            <span className="text-sm font-bold text-gray-800">
              {uploading ? "Uploading images..." : "Click or drag to add machine photos"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Supports JPG, PNG, and WebP (Up to 10MB each) • Maximum {maxImages} photos
            </span>
          </label>
        </div>
      )}

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className={`group relative rounded-xl overflow-hidden border bg-gray-100 aspect-4/3 flex flex-col justify-between transition-all ${
                idx === 0
                  ? "border-amber-500 ring-2 ring-amber-400/40 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Image Preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Machinery Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badges Overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                {idx === 0 ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                    ★ Main Cover
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    #{idx + 1}
                  </span>
                )}
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="px-2 py-1 bg-white/90 hover:bg-white text-gray-900 text-[10px] font-bold rounded-lg shadow-xs transition-colors"
                    title="Make this photo the primary cover image"
                  >
                    Set as Main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="px-2 py-1 bg-red-600/90 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg shadow-xs transition-colors ml-auto flex items-center gap-1"
                  title="Remove this photo"
                >
                  <span>🗑️</span>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
