"use client";

/**
 * SmartProcure AI — Phase 3: Plant Disease Detection Panel
 *
 * Integrates into the existing farmer AI assistant page.
 * Reuses: ProductCard, ProductRecommendations (same components as Phase 2),
 *         FormattedMessage, CHAT_TRANSLATIONS, and the PRODUCTS_JSON stream protocol.
 *
 * Upload flow:
 *   File input (accept JPEG/PNG/WebP, capture=environment for mobile)
 *   → client-side size/type validation → image preview
 *   → POST multipart/form-data to /api/ai/analyze-plant
 *   → parse PRODUCTS_JSON prefix + stream analysis text
 *   → render FormattedMessage + ProductRecommendations
 */

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { AIProductRecord } from "@/lib/ai/product-search";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — mirror of server limit
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PRODUCTS_PREFIX = "PRODUCTS_JSON:";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnalysisState = "idle" | "loading" | "done" | "error";

interface AnalysisResult {
  text: string;
  products: AIProductRecord[];
}

// ── Sub-components (reuse existing design language) ───────────────────────────

/** Lightweight markdown renderer — same as chat-client.tsx FormattedMessage */
function FormattedAnalysis({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "bullet" | "number" | null = null;

  const flushList = () => {
    if (currentList.length > 0 && listType) {
      if (listType === "bullet") {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-1">
            {currentList.map((item, i) => (
              <li key={i} className="leading-relaxed">{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 pl-1">
            {currentList.map((item, i) => (
              <li key={i} className="leading-relaxed">{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const renderInline = (str: string): React.ReactNode => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-bold text-emerald-950">{part.slice(2, -2)}</strong>
      ) : part
    );
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (listType !== "bullet") flushList();
      listType = "bullet";
      currentList.push(line.slice(2));
      return;
    }
    const numMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (listType !== "number") flushList();
      listType = "number";
      currentList.push(numMatch[1]);
      return;
    }
    flushList();
    if (line === "") return;
    if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("# ")) {
      const hLevel = line.startsWith("### ") ? 4 : line.startsWith("## ") ? 3 : 2;
      const text = line.replace(/^#+\s+/, "");
      elements.push(
        React.createElement(
          `h${hLevel}` as "h2" | "h3" | "h4",
          { key: `h-${idx}`, className: "font-bold text-emerald-900 text-sm mt-3 mb-1" },
          renderInline(text)
        )
      );
      return;
    }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(
        <p key={`bold-${idx}`} className="font-bold text-emerald-900 text-sm mt-2 mb-0.5">
          {renderInline(line)}
        </p>
      );
      return;
    }
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-1 text-xs sm:text-sm text-gray-800">{elements}</div>;
}

/** Product card — matches Phase 2 design exactly */
function ProductCard({
  product,
  language,
}: {
  product: AIProductRecord;
  language: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];
  const priceFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(product.price);

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col">
      <div className="relative w-full h-32 bg-gray-100 flex-shrink-0 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 180px"
          className="object-cover"
        />
        <div className="absolute top-1.5 right-1.5">
          {product.inStock ? (
            <span className="bg-emerald-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {t.inStock}
            </span>
          ) : (
            <span className="bg-gray-700/90 text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {t.outOfStock}
            </span>
          )}
        </div>
        <div className="absolute bottom-1.5 left-1.5">
          <span className="bg-white/90 text-gray-800 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs">
            {product.categoryName}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">{product.name}</h4>
          {product.suitableCrops && (
            <p className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded line-clamp-1">
              🌾 {product.suitableCrops}
            </p>
          )}
          <p className="text-[10px] text-gray-500 truncate">
            {t.soldBy}: <span className="font-semibold text-gray-700">{product.shopName}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
          <div>
            <div className="text-sm font-black text-gray-900">{priceFormatted}</div>
            {product.unit && <div className="text-[10px] text-gray-500">per {product.unit}</div>}
          </div>
          <Link
            href={product.detailUrl}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.viewProduct}
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function PlantAnalysisPanel({
  language,
  onAskFollowUp,
}: {
  language: SupportedLanguage;
  /** Called with the analysis summary so the user can ask a follow-up in the chat */
  onAskFollowUp?: (text: string) => void;
}) {
  const t = CHAT_TRANSLATIONS[language];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevPreviewRef = useRef<string | null>(null);

  // Clean up object URL on change
  const setPreview = useCallback((url: string | null) => {
    if (prevPreviewRef.current) {
      URL.revokeObjectURL(prevPreviewRef.current);
    }
    prevPreviewRef.current = url;
    setPreviewUrl(url);
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      setErrorMsg(null);
      setResult(null);

      // Client-side validation (server re-validates)
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setErrorMsg(t.imageInvalidType);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setErrorMsg(t.imageTooBig);
        return;
      }

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setAnalysisState("idle");
    },
    [t, setPreview]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so the same file can be reselected after removal
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
    setAnalysisState("idle");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg(t.noImageSelected);
      return;
    }
    if (analysisState === "loading") return;

    setAnalysisState("loading");
    setErrorMsg(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", selectedFile);
      form.append("language", language);

      const response = await fetch("/api/ai/analyze-plant", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          errorData.error === "IMAGE_TOO_LARGE"
            ? t.imageTooBig
            : errorData.error === "INVALID_IMAGE_TYPE"
            ? t.imageInvalidType
            : errorData.message || t.imageUploadError;
        setErrorMsg(msg);
        setAnalysisState("error");
        return;
      }

      // Parse stream — same PRODUCTS_JSON protocol as /api/ai/chat
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let productsExtracted = false;
      let products: AIProductRecord[] = [];
      let analysisText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const raw = decoder.decode(value, { stream: true });
          buffer += raw;

          if (!productsExtracted) {
            if (buffer.startsWith(PRODUCTS_PREFIX)) {
              const newlineIdx = buffer.indexOf("\n");
              if (newlineIdx !== -1) {
                const metaLine = buffer.slice(PRODUCTS_PREFIX.length, newlineIdx);
                const remainder = buffer.slice(newlineIdx + 1);
                productsExtracted = true;
                try {
                  const parsed = JSON.parse(metaLine);
                  if (Array.isArray(parsed)) {
                    products = parsed.filter(
                      (p) =>
                        p &&
                        typeof p === "object" &&
                        typeof p.id === "string" &&
                        typeof p.name === "string" &&
                        typeof p.price === "number" &&
                        typeof p.detailUrl === "string"
                    );
                  }
                } catch {
                  // Malformed metadata — proceed without products
                }
                analysisText += remainder;
                buffer = "";
                continue;
              }
              continue; // Wait for newline
            } else {
              productsExtracted = true;
              analysisText += buffer;
              buffer = "";
            }
          } else {
            analysisText += raw;
          }
        }
      }

      setResult({ text: analysisText.trim(), products });
      setAnalysisState("done");
    } catch (err) {
      console.error("Plant analysis client error:", err);
      setErrorMsg(t.networkError ?? "Unable to connect. Please try again.");
      setAnalysisState("error");
    }
  };

  const handleRetry = () => {
    setResult(null);
    setErrorMsg(null);
    setAnalysisState("idle");
  };

  const handleAskFollowUp = () => {
    if (!result?.text || !onAskFollowUp) return;
    // Send a concise summary to the chat as context
    const summary =
      language === "te"
        ? `నా మొక్క ఫోటో విశ్లేషణ ఫలితం:\n\n${result.text.slice(0, 500)}...\n\nఈ విషయంలో నాకు మరిన్ని వివరాలు చెప్పగలరా?`
        : `Based on my plant photo analysis:\n\n${result.text.slice(0, 500)}...\n\nCan you provide more details about this?`;
    onAskFollowUp(summary);
  };

  return (
    <div className="border border-emerald-200 rounded-2xl bg-white overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
        <span className="text-lg">🔬</span>
        <div>
          <h3 className="text-sm font-black text-emerald-900">{t.analysisHeading}</h3>
          <p className="text-[10px] text-emerald-600">
            {language === "te"
              ? "మొక్క ఫోటో అప్‌లోడ్ చేయండి — AI వ్యాధిని విశ్లేషిస్తుంది"
              : "Upload a plant photo — AI will identify diseases, pests & deficiencies"}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Image Upload / Preview ─────────────────────────────── */}
        {!previewUrl ? (
          <div
            className="border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file);
            }}
            role="button"
            tabIndex={0}
            aria-label={t.uploadPhoto}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                🌿
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">{t.uploadPhoto}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {language === "te" ? "JPEG, PNG, WebP • గరిష్టం 5 MB" : "JPEG, PNG, WebP • Max 5 MB"}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                  {language === "te" ? "లేదా మొబైల్‌లో ఫోటో తీయండి" : "Or take a photo on mobile"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-gray-50">
            <div className="relative w-full h-48 sm:h-56">
              <Image
                src={previewUrl}
                alt="Selected plant"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 480px"
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-white/90 hover:bg-white text-xs font-bold text-emerald-800 rounded-lg border border-emerald-200 shadow-xs transition-colors"
                aria-label={t.changePhoto}
              >
                {t.changePhoto}
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-2.5 py-1.5 bg-white/90 hover:bg-red-50 text-xs font-bold text-red-700 rounded-lg border border-red-200 shadow-xs transition-colors"
                aria-label={t.removePhoto}
              >
                {t.removePhoto}
              </button>
            </div>
            {selectedFile && (
              <div className="px-3 py-2 border-t border-emerald-100 bg-white">
                <p className="text-[10px] text-gray-500 truncate">
                  📷 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hidden file input — supports both gallery + camera on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        {/* ── Error Message ──────────────────────────────────────── */}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="flex-1">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-700 font-bold"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Analyze Button ─────────────────────────────────────── */}
        {analysisState !== "done" && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedFile || analysisState === "loading"}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {analysisState === "loading" ? (
              <>
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </span>
                <span>{t.analyzingPlant}</span>
              </>
            ) : (
              <>
                <span>🔬</span>
                <span>{t.analyzeButton}</span>
              </>
            )}
          </button>
        )}

        {/* ── Analysis Results ───────────────────────────────────── */}
        {analysisState === "done" && result && (
          <div className="space-y-4">
            {/* Result text */}
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-base">🌱</span>
                <h4 className="text-sm font-black text-emerald-900">{t.analysisHeading}</h4>
              </div>
              <FormattedAnalysis text={result.text} />
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[10px] text-amber-900 leading-relaxed">{t.analysisDisclaimer}</p>
            </div>

            {/* Product recommendations */}
            {result.products.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛒</span>
                  <span>{t.diseaseProductsHeading}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {result.products.map((product) => (
                    <ProductCard key={product.id} product={product} language={language} />
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t.retryAnalysis}
              </button>
              {onAskFollowUp && (
                <button
                  type="button"
                  onClick={handleAskFollowUp}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {t.askFollowUp}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
