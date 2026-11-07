"use client";

import React, { useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

export interface MediaAssetUploaderProps {
  value: string;
  onChange: (url: string) => void;
  category?: "branding" | "avatar" | "social" | "general";
  scopeId?: string;
  label?: string;
  hint?: string;
  previewType?: "avatar" | "logo" | "social-card" | "generic";
  defaultPreviewUrl?: string;
  socialCardInfo?: {
    brandName?: string;
    title?: string;
    description?: string;
    host?: string;
  };
  onDelete?: () => Promise<void> | void;
}

export function MediaAssetUploader({
  value,
  onChange,
  category = "branding",
  scopeId,
  label,
  hint,
  previewType = "generic",
  defaultPreviewUrl,
  socialCardInfo,
  onDelete,
}: MediaAssetUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUrlInputMode, setIsUrlInputMode] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const displayImage = value || defaultPreviewUrl;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      if (scopeId) {
        formData.append("scope_id", scopeId);
      }

      const res = await apiClient.uploadFormData<{
        url: string;
        key: string;
        bytes: number;
      }>("/media/assets/", formData);

      if (res?.data?.url) {
        onChange(res.data.url);
      } else {
        throw new Error("Invalid response from media upload API");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to upload asset to Cloudflare R2"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) {
      onChange("");
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      // Call DELETE to purge from Cloudflare R2
      await apiClient.delete("/media/assets/", { asset_url: value });
      onChange("");
      if (onDelete) {
        await onDelete();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to delete asset from Cloudflare R2"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUrlInputMode(!isUrlInputMode)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 cursor-pointer"
            >
              <LinkIcon className="size-3" />
              {isUrlInputMode ? "File upload mode" : "Paste URL"}
            </button>
          </div>
        </div>
      )}

      {/* Manual URL Input Bar if toggled */}
      {isUrlInputMode ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={manualUrl || value}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://cdn.musfiqdehan.com/beamline/..."
            className="input text-xs"
          />
          <button
            type="button"
            onClick={() => {
              if (manualUrl.trim()) {
                onChange(manualUrl.trim());
                setIsUrlInputMode(false);
              }
            }}
            className="btn-secondary btn-sm"
          >
            Apply
          </button>
        </div>
      ) : null}

      {/* Upload Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragOver
            ? "border-amber-500 bg-amber-500/10"
            : "border-stone-300 bg-stone-50/50 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50 dark:hover:bg-stone-900"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <Loader2 className="size-6 animate-spin text-amber-500" />
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              Uploading asset to Cloudflare R2...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UploadCloud className="size-5" />
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-300">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 cursor-pointer"
              >
                Click to upload
              </button>{" "}
              or drag and drop
            </div>
            <p className="text-[11px] text-stone-400">
              SVG, PNG, JPG, or WEBP (Direct sync with R2: cdn.musfiqdehan.com)
            </p>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-rose-500 hover:text-rose-700 dark:hover:text-rose-200"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* PREVIEWS */}
      {previewType === "social-card" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Social Share Preview (1200×630 OG Card)</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 text-[11px]">
              {value ? "Custom R2 Cover Active" : "Default Template Active"}
            </span>
          </div>

          {/* Simulated OpenGraph Share Card */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-lg dark:border-stone-800">
            <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-stone-950">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Social share preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone-500">
                  <ImageIcon className="size-8" />
                  <span className="text-xs">No cover image configured</span>
                </div>
              )}
            </div>

            {/* Social card metadata footer (Simulating X / LinkedIn preview snippet) */}
            <div className="border-t border-stone-800 bg-stone-950 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-amber-500">
                <Globe className="size-3" />
                <span>{socialCardInfo?.host || "beamline.musfiqdehan.com"}</span>
              </div>
              <h4 className="mt-1 font-bold text-sm text-stone-100 line-clamp-1">
                {socialCardInfo?.title || "BeamLine — Autonomous Construction CRM & Operations OS"}
              </h4>
              <p className="mt-0.5 text-xs text-stone-400 line-clamp-2">
                {socialCardInfo?.description ||
                  "White-labeled client workspaces, 4-phase build execution, AI margin protection, and automated invoice deduplication."}
              </p>
            </div>
          </div>
        </div>
      )}

      {previewType === "avatar" && (
        <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-amber-500/30 bg-stone-200 dark:bg-stone-800">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-stone-500 text-lg">
                U
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Profile Photo Preview
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Synced directly with Cloudflare R2 bucket &quot;root&quot;
            </p>
          </div>
        </div>
      )}

      {previewType === "logo" && (
        <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white p-2 dark:border-stone-700 dark:bg-stone-800">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Logo preview"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <ImageIcon className="size-6 text-stone-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Brand Logo
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Displayed in workspace navigation and browser tab
            </p>
          </div>
        </div>
      )}

      {/* Delete / Reset Action */}
      {value ? (
        <div className="flex items-center justify-between pt-1">
          <span className="max-w-xs truncate font-mono text-[11px] text-stone-500 dark:text-stone-400" title={value}>
            {value}
          </span>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer transition"
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
            {isDeleting ? "Deleting from R2..." : "Delete & Reset to Default"}
          </button>
        </div>
      ) : null}

      {hint && (
        <p className="text-[11px] text-stone-500 dark:text-stone-400">{hint}</p>
      )}
    </div>
  );
}
