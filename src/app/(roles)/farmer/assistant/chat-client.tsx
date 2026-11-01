"use client";

/**
 * SmartProcure AI Farming Assistant — Chat Client
 *
 * Unified ChatGPT-style composer:
 *   • Normal text → /api/ai/chat   (Phase 1 + Phase 2 streaming)
 *   • Image [+ text] → /api/ai/analyze-plant  (Phase 3 vision)
 *
 * Both flows produce assistant messages in the same conversation thread.
 * Product cards (Phase 2/3) appear inline inside assistant bubbles.
 * The separate PlantAnalysisPanel toggle has been removed.
 *
 * Phase 4 additions:
 *   • Microphone button → Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 *   • Speaker button per assistant bubble → speechSynthesis
 *   • Auto-speak toggle (localStorage-persisted, client-only)
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { SupportedLanguage, CHAT_TRANSLATIONS } from "@/lib/ai/i18n";
import { AIProductRecord } from "@/lib/ai/product-search";
import { generateFollowUpSuggestions } from "@/lib/ai/suggestions";

// ── Constants ─────────────────────────────────────────────────────────────────

const PRODUCTS_PREFIX = "PRODUCTS_JSON:";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUTO_SPEAK_KEY = "smartprocure-voice-pref";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  error?: boolean;
  /** Image thumbnail URL (object URL) shown in user bubble */
  imagePreviewUrl?: string;
  /** Validated product records attached to assistant messages */
  products?: AIProductRecord[];
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getFormattedTime(date: Date = new Date()): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${h}:${m} ${ampm}`;
}

/** Parse PRODUCTS_JSON: prefix from a buffer, returns { products, remainder }. */
function extractProductsFromBuffer(
  buffer: string
): { products: AIProductRecord[]; remainder: string } | null {
  if (!buffer.startsWith(PRODUCTS_PREFIX)) return null;
  const newlineIdx = buffer.indexOf("\n");
  if (newlineIdx === -1) return null; // Still buffering

  const metaLine = buffer.slice(PRODUCTS_PREFIX.length, newlineIdx);
  const remainder = buffer.slice(newlineIdx + 1);
  let products: AIProductRecord[] = [];
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
    // Malformed — proceed with no products
  }
  return { products, remainder };
}

/**
 * Strip PRODUCTS_JSON metadata lines from text before speaking.
 * Also strips any stray JSON array lines that start with `[{`.
 */
export function stripProductsForSpeech(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith(PRODUCTS_PREFIX)) return false;
      // Skip bare JSON array lines that leaked through
      if (trimmed.startsWith("[{") && trimmed.endsWith("}]")) return false;
      return true;
    })
    .join("\n")
    .trim();
}

/** Map app language to BCP-47 speech locale. */
export function getSpeechLang(language: SupportedLanguage): string {
  return language === "te" ? "te-IN" : "en-IN";
}

/** Map SpeechRecognition error codes to i18n key names. */
export function mapVoiceError(
  errorCode: string
): "micPermissionDenied" | "noSpeechDetected" | "voiceError" {
  if (errorCode === "not-allowed" || errorCode === "service-not-allowed")
    return "micPermissionDenied";
  if (errorCode === "no-speech") return "noSpeechDetected";
  return "voiceError";
}

// ── Web Speech API type helpers (vendor-prefixed across browsers) ─────────────

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message?: string;
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] as SpeechRecognitionCtor | undefined) ||
    (w["webkitSpeechRecognition"] as SpeechRecognitionCtor | undefined);
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Lightweight safe markdown renderer (same as before). */
function FormattedMessage({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "bullet" | "number" | null = null;

  const flush = () => {
    if (!currentList.length || !listType) return;
    if (listType === "bullet") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-1">
          {currentList.map((it, i) => <li key={i} className="leading-relaxed">{inlineFmt(it)}</li>)}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 pl-1">
          {currentList.map((it, i) => <li key={i} className="leading-relaxed">{inlineFmt(it)}</li>)}
        </ol>
      );
    }
    currentList = [];
    listType = null;
  };

  const inlineFmt = (s: string): React.ReactNode =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-bold text-emerald-950">{p.slice(2, -2)}</strong>
        : p
    );

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (listType !== "bullet") flush();
      listType = "bullet"; currentList.push(line.slice(2)); return;
    }
    const nm = line.match(/^\d+\.\s+(.*)$/);
    if (nm) {
      if (listType !== "number") flush();
      listType = "number"; currentList.push(nm[1]); return;
    }
    flush();
    if (!line) return;
    if (line.startsWith("### ")) {
      elements.push(<h4 key={`h-${idx}`} className="font-bold text-emerald-900 text-sm mt-3 mb-1">{inlineFmt(line.slice(4))}</h4>);
      return;
    }
    elements.push(<p key={`p-${idx}`} className="leading-relaxed my-1.5">{inlineFmt(line)}</p>);
  });
  flush();
  return <div className="space-y-1">{elements}</div>;
}

/** Product card — identical to Phase 2 design. */
function ProductCard({
  product,
  language,
}: {
  product: AIProductRecord;
  language: SupportedLanguage;
}) {
  const t = CHAT_TRANSLATIONS[language];
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(product.price);

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col">
      <div className="relative w-full h-32 bg-gray-100 flex-shrink-0 overflow-hidden">
        <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 180px" className="object-cover" />
        <div className="absolute top-1.5 right-1.5">
          {product.inStock
            ? <span className="bg-emerald-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t.inStock}</span>
            : <span className="bg-gray-700/90 text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full">{t.outOfStock}</span>}
        </div>
        <div className="absolute bottom-1.5 left-1.5">
          <span className="bg-white/90 text-gray-800 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs">{product.categoryName}</span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">{product.name}</h4>
          {product.suitableCrops && (
            <p className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded line-clamp-1">🌾 {product.suitableCrops}</p>
          )}
          <p className="text-[10px] text-gray-500 truncate">{t.soldBy}: <span className="font-semibold text-gray-700">{product.shopName}</span></p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
          <div>
            <div className="text-sm font-black text-gray-900">{price}</div>
            {product.unit && <div className="text-[10px] text-gray-500">per {product.unit}</div>}
          </div>
          <Link
            href={product.detailUrl}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap"
            target="_blank" rel="noopener noreferrer"
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

function ProductRecommendations({ products, language }: { products: AIProductRecord[]; language: SupportedLanguage }) {
  const t = CHAT_TRANSLATIONS[language];
  if (!products.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
        <span>🛒</span><span>{t.productsHeading}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {products.map((p) => <ProductCard key={p.id} product={p} language={language} />)}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AIFarmingChatClient({
  farmerName,
  initialQuery,
}: {
  farmerName?: string;
  initialQuery?: string;
}) {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const t = CHAT_TRANSLATIONS[language];

  const createInitialMessage = useCallback(
    (lang: SupportedLanguage): ChatMessage => ({
      id: "welcome-message",
      role: "assistant",
      content: CHAT_TRANSLATIONS[lang].welcome,
      timestamp: getFormattedTime(),
    }),
    []
  );

  // ── Chat state ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createInitialMessage("en")]);
  const [input, setInput] = useState(initialQuery || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Image attachment state ──────────────────────────────────────────
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // ── Plus-menu state ─────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Phase 4: Voice input state ──────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputError, setVoiceInputError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // ── Phase 4: TTS state ──────────────────────────────────────────────
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  // Phase 4 refs
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  // Track the last completed assistant message id to support auto-speak
  const lastAssistantMsgIdRef = useRef<string | null>(null);
  // Track previous isLoading value for transition detection
  const prevIsLoadingRef = useRef(false);

  // Unique IDs for accessible file inputs
  const photoInputId = useId();
  const cameraInputId = useId();

  // ── Object URL lifecycle ────────────────────────────────────────────
  const prevPreviewRef = useRef<string | null>(null);
  const setPreview = useCallback((url: string | null) => {
    if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current);
    prevPreviewRef.current = url;
    setImagePreviewUrl(url);
  }, []);

  // ── Phase 4: Detect browser capabilities on mount ──────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // SpeechRecognition availability (vendor-prefixed in some browsers)
    setVoiceSupported(Boolean(getSpeechRecognitionCtor()));

    // SpeechSynthesis availability
    setTtsSupported(Boolean(window.speechSynthesis));

    // Load auto-speak preference from localStorage (client-only, hydration-safe)
    try {
      const stored = localStorage.getItem(AUTO_SPEAK_KEY);
      if (stored === "true") setAutoSpeak(true);
    } catch {
      // localStorage may be unavailable in some browser contexts
    }

    // Cleanup on unmount
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Scroll to bottom ────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  // ── Close plus-menu on outside click ───────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        plusBtnRef.current && !plusBtnRef.current.contains(e.target as Node)
      ) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // ── Phase 4: Auto-speak when a response finishes loading ────────────
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    // Transition: loading=true → loading=false (response complete)
    if (wasLoading && !isLoading && autoSpeak && !isRecording && ttsSupported) {
      const msgId = lastAssistantMsgIdRef.current;
      if (msgId) {
        // Find the final content of that message
        setMessages((prev) => {
          const msg = prev.find((m) => m.id === msgId);
          if (msg && msg.content && !msg.error) {
            speakText(msg.content, msgId);
          }
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // ── Phase 4: TTS helper ─────────────────────────────────────────────
  const speakText = useCallback((text: string, msgId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);

    const clean = stripProductsForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = getSpeechLang(language);
    utterance.rate = 0.95;

    // Try to pick an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const targetLang = utterance.lang.toLowerCase();
    const matched = voices.find(
      (v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2))
    );
    if (matched) {
      utterance.voice = matched;
    } else if (language === "te") {
      // Telugu voice not available — use default, no notification needed at this point
    }

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const handleToggleSpeak = useCallback((msg: ChatMessage) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMsgId === msg.id) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      speakText(msg.content, msg.id);
    }
  }, [speakingMsgId, speakText]);

  // ── Phase 4: Toggle auto-speak preference ──────────────────────────
  const handleToggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    try {
      localStorage.setItem(AUTO_SPEAK_KEY, String(next));
    } catch {
      // Ignore
    }
  };

  // ── Phase 4: Microphone ─────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();

    if (!SpeechRecognitionCtor) {
      setVoiceInputError(t.voiceUnsupported);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    setVoiceInputError(null);

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = getSpeechLang(language);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let interimSnapshot = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      if (final) finalTranscript += final;
      interimSnapshot = interim;

      // Show live transcription in the textarea (interim + accumulated final)
      setInput((prev) => {
        const base = prev.replace(interimSnapshot, "").trimEnd();
        return (base ? base + " " : "") + finalTranscript + interim;
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const key = mapVoiceError(event.error);
      setVoiceInputError(t[key]);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Finalize: replace any interim remainder with only confirmed final text
      if (finalTranscript) {
        setInput((prev) => {
          // Strip the trailing interim snapshot if still appended
          const trimmed = interimSnapshot
            ? prev.endsWith(interimSnapshot)
              ? prev.slice(0, prev.length - interimSnapshot.length).trimEnd()
              : prev
            : prev;
          return (trimmed ? trimmed + " " : "") + finalTranscript.trim();
        });
      }
      textareaRef.current?.focus();
    };

    recognition.start();
    setIsRecording(true);
  }, [isRecording, language, t]);

  // ── Image selection ─────────────────────────────────────────────────
  const handleFileSelected = useCallback((file: File) => {
    setImageError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError(t.imageInvalidType);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t.imageTooBig);
      return;
    }
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setMenuOpen(false);
    textareaRef.current?.focus();
  }, [t, setPreview]);

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = ""; // Allow reselecting same file
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreview(null);
    setImageError(null);
  };

  // ── Language / new-chat ─────────────────────────────────────────────
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setErrorMessage(null);
    if (messages.length === 1 && messages[0].id === "welcome-message") {
      setMessages([createInitialMessage(newLang)]);
    }
  };

  const handleNewChat = () => {
    // Stop any ongoing speech/recording on new chat
    recognitionRef.current?.abort();
    setIsRecording(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);

    setMessages([createInitialMessage(language)]);
    setInput("");
    setErrorMessage(null);
    setVoiceInputError(null);
    setIsLoading(false);
    handleRemoveImage();
    textareaRef.current?.focus();
  };

  // ── Unified send ────────────────────────────────────────────────────
  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText !== undefined ? messageText : input).trim();
    const hasImage = Boolean(selectedImage);

    // Require either text or image
    if (!textToSend && !hasImage) {
      setErrorMessage(t.emptyError);
      return;
    }
    if (textToSend.length > 1000) {
      setErrorMessage(t.tooLongError);
      return;
    }
    if (isLoading) return;

    // Stop recording if active
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setErrorMessage(null);
    setImageError(null);
    setVoiceInputError(null);

    // Snapshot the image before clearing state
    const imageFile = selectedImage;
    const previewForBubble = imagePreviewUrl;

    // Build user message bubble
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
      timestamp: getFormattedTime(),
      imagePreviewUrl: previewForBubble ?? undefined,
    };

    const contextHistory = messages
      .filter((m) => m.id !== "welcome-message" && !m.error)
      .map((m) => ({
        role: m.role,
        content: m.content || (language === "te" ? "[మొక్క ఫోటో విశ్లేషణ అభ్యర్థించబడింది]" : "[Uploaded plant photo for disease analysis]"),
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // Keep preview visible in the message bubble; clear composer attachment
    setSelectedImage(null);
    setPreview(null);
    setIsLoading(true);

    const assistantMsgId = crypto.randomUUID();
    lastAssistantMsgIdRef.current = assistantMsgId;

    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "", timestamp: getFormattedTime() },
    ]);

    try {
      if (imageFile) {
        // ── Image path → /api/ai/analyze-plant ─────────────────────
        const form = new FormData();
        form.append("image", imageFile);
        form.append("language", language);
        if (textToSend) form.append("text", textToSend);

        const response = await fetch("/api/ai/analyze-plant", {
          method: "POST",
          body: form,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg =
            errorData.error === "IMAGE_TOO_LARGE" ? t.imageTooBig
              : errorData.error === "INVALID_IMAGE_TYPE" ? t.imageInvalidType
              : errorData.message || t.imageUploadError;
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: msg, error: true } : m));
          setErrorMessage(msg);
          setIsLoading(false);
          return;
        }

        // Stream response — same PRODUCTS_JSON protocol
        await consumeStream(response, assistantMsgId);
      } else {
        // ── Text-only path → /api/ai/chat ─────────────────────────
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend, language, history: contextHistory }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let displayError = t.networkError;
          if (errorData.error === "GEMINI_API_KEY_NOT_CONFIGURED") {
            displayError = `${t.missingKeyError} ${t.missingKeyHelp}`;
          } else if (errorData.message) {
            displayError = errorData.message;
          }
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: displayError, error: true } : m));
          setErrorMessage(displayError);
          setIsLoading(false);
          return;
        }

        await consumeStream(response, assistantMsgId);
      }
    } catch (err: unknown) {
      console.error("Chat send error:", err);
      const displayError = t.networkError;
      setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: displayError, error: true } : m));
      setErrorMessage(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Consumes a streaming text/plain response with optional PRODUCTS_JSON prefix.
   * Works for both /api/ai/chat and /api/ai/analyze-plant.
   */
  const consumeStream = async (response: Response, assistantMsgId: string) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let productsExtracted = false;

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      buffer += raw;

      if (!productsExtracted) {
        if (buffer.startsWith(PRODUCTS_PREFIX)) {
          const result = extractProductsFromBuffer(buffer);
          if (!result) continue; // Newline not yet received — keep buffering

          productsExtracted = true;
          const { products, remainder } = result;

          if (products.length > 0) {
            setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, products } : m));
          }
          if (remainder) {
            setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + remainder } : m));
          }
          buffer = "";
        } else {
          // No products prefix — flush immediately
          productsExtracted = true;
          if (buffer) {
            setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + buffer } : m));
            buffer = "";
          }
        }
      } else {
        if (raw) {
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + raw } : m));
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Contextual Follow-up Suggestions (Phase 5) ─────────────────────
  const lastCompletedAssistantMsg = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.id !== "welcome-message" && !m.error && m.content);

  const contextualSuggestions = lastCompletedAssistantMsg
    ? generateFollowUpSuggestions({
        lastAssistantMessage: lastCompletedAssistantMsg.content,
        language,
        hasProducts: Boolean(lastCompletedAssistantMsg.products && lastCompletedAssistantMsg.products.length > 0),
      })
    : [];

  const handleSelectSuggestion = (suggestionText: string) => {
    setInput(suggestionText);
    textareaRef.current?.focus();
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] max-h-[820px] bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">

      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
            <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight">{t.title}</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                {t.badge}
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 hidden sm:block max-w-lg truncate">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-speak toggle (only shown when TTS is supported) */}
          {ttsSupported && (
            <button
              type="button"
              onClick={handleToggleAutoSpeak}
              title={autoSpeak ? t.voiceResponsesOn : t.voiceResponsesOff}
              aria-label={autoSpeak ? t.voiceResponsesOn : t.voiceResponsesOff}
              aria-pressed={autoSpeak}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                autoSpeak
                  ? "bg-white/20 border-white/30 text-white"
                  : "bg-white/10 hover:bg-white/15 border-white/15 text-emerald-200 hover:text-white"
              }`}
            >
              {/* Speaker icon */}
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                {autoSpeak ? (
                  // Speaker with waves
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                ) : (
                  // Speaker muted
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                )}
              </svg>
              <span className="hidden sm:inline">{autoSpeak ? "Auto" : "Auto"}</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="inline-flex rounded-xl bg-emerald-950/40 p-1 border border-white/15" role="group" aria-label={t.languageLabel}>
            {(["en", "te"] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${language === lang ? "bg-white text-emerald-900 shadow-xs" : "text-emerald-100 hover:text-white"}`}
                aria-pressed={language === lang}
              >
                {lang === "en" ? "English" : "తెలుగు"}
              </button>
            ))}
          </div>

          {/* New Chat */}
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors border border-white/15"
            title={t.newChat}
            aria-label={t.newChat}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">{t.newChat}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Message History ────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-emerald-50/20"
        role="log"
        aria-live="polite"
        aria-label="Chat Message History"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isSpeaking = speakingMsgId === msg.id;
          const showSpeaker =
            !isUser && ttsSupported && Boolean(msg.content) && !msg.error;

          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black shadow-xs ${isUser ? "bg-emerald-700 text-white" : msg.error ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                {isUser ? (farmerName?.charAt(0).toUpperCase() ?? "F") : <span>🌱</span>}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-2xs ${isUser ? "bg-emerald-700 text-white rounded-tr-xs" : msg.error ? "bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs" : "bg-white border border-emerald-100/80 text-gray-800 rounded-tl-xs"}`}>

                {/* Image thumbnail in user bubble */}
                {isUser && msg.imagePreviewUrl && (
                  <div className="mb-2">
                    <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-white/30">
                      <Image
                        src={msg.imagePreviewUrl}
                        alt="Plant photo"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    {!msg.content && (
                      <p className="mt-1 text-emerald-200 text-[10px] italic">📷 {t.imageAttached}</p>
                    )}
                  </div>
                )}

                <div className="break-words">
                  {isUser
                    ? msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    : <FormattedMessage text={msg.content} />
                  }
                </div>

                {/* Product cards on assistant messages */}
                {!isUser && msg.products && msg.products.length > 0 && (
                  <ProductRecommendations products={msg.products} language={language} />
                )}

                {/* Timestamp + speaker button row */}
                <div className={`mt-1.5 flex items-center gap-2 ${isUser ? "justify-end" : "justify-between"} min-h-[20px]`}>
                  {/* Speaker button (assistant bubbles only) */}
                  {showSpeaker && (
                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(msg)}
                      aria-label={isSpeaking ? t.stopSpeaking : t.listenToResponse}
                      title={isSpeaking ? t.stopSpeaking : t.listenToResponse}
                      className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors shrink-0 ${
                        isSpeaking
                          ? "bg-emerald-700 text-white"
                          : "bg-gray-100 hover:bg-emerald-100 text-gray-500 hover:text-emerald-700"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        {isSpeaking ? (
                          // Stop icon
                          <rect x="6" y="6" width="12" height="12" rx="1" />
                        ) : (
                          // Speaker icon
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        )}
                      </svg>
                    </button>
                  )}

                  <span className={`text-[10px] ${isUser ? "text-emerald-200" : "text-gray-400"} ${showSpeaker ? "" : "ml-auto"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0 text-xs font-black shadow-xs">
              <span>🌱</span>
            </div>
            <div className="bg-white border border-emerald-100 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-[11px] text-gray-500 italic">
                  {selectedImage ? t.sendingImage : t.thinking}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. Suggested questions ────────────────────────────────── */}
      {/* 3a. Contextual Follow-up Suggestions (Phase 5) */}
      {contextualSuggestions.length > 0 && !isLoading && (
        <div className="px-4 py-2.5 bg-emerald-50/50 border-t border-emerald-100/60">
          <p className="text-[11px] font-bold text-emerald-900 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <span>💬</span><span>{t.followUpHeading}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {contextualSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className="text-xs bg-white hover:bg-emerald-100/80 active:bg-emerald-200 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs transition-all text-left hover:border-emerald-300"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3b. Initial starter questions (shown before active conversation) */}
      {messages.length <= 2 && !lastCompletedAssistantMsg && (
        <div className="px-4 py-3 bg-emerald-50/50 border-t border-emerald-100/60">
          <p className="text-[11px] font-bold text-emerald-900 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <span>💡</span><span>{t.suggestedHeading}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {t.suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(s)}
                className="text-xs bg-white hover:bg-emerald-100/80 active:bg-emerald-200 text-emerald-800 font-medium px-3 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Error banners ──────────────────────────────────────── */}
      {(errorMessage || imageError) && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="flex-1 font-semibold">{imageError || errorMessage}</p>
          <button type="button" onClick={() => { setErrorMessage(null); setImageError(null); }} className="text-red-400 hover:text-red-700 font-bold ml-1" aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Voice input error banner */}
      {voiceInputError && (
        <div className="mx-4 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="flex-1 font-semibold">{voiceInputError}</p>
          <button type="button" onClick={() => setVoiceInputError(null)} className="text-amber-400 hover:text-amber-700 font-bold ml-1" aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Recording indicator banner */}
      {isRecording && (
        <div className="mx-4 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="font-semibold">{t.listening}</span>
        </div>
      )}

      {/* ── 5. Composer ───────────────────────────────────────────── */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-100">

        {/* Image preview strip (above the input row) */}
        {imagePreviewUrl && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-200 flex-shrink-0">
              <Image src={imagePreviewUrl} alt="Attachment preview" fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-emerald-800 truncate">📷 {selectedImage?.name ?? t.imageAttached}</p>
              <p className="text-[10px] text-gray-500">{selectedImage ? `${(selectedImage.size / 1024).toFixed(0)} KB` : ""}</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center text-gray-600 hover:text-red-700 transition-colors shrink-0"
              aria-label={t.removePhoto}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input row: [+] [textarea] [mic] [send] */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-end gap-2"
        >
          {/* Plus button + dropdown menu */}
          <div className="relative flex-shrink-0">
            <button
              ref={plusBtnRef}
              type="button"
              disabled={isLoading}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t.addAttachment}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border font-bold text-lg ${menuOpen ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-gray-100 hover:bg-emerald-50 border-gray-200 hover:border-emerald-300 text-gray-600 hover:text-emerald-700"} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              +
            </button>

            {/* Attachment menu */}
            {menuOpen && (
              <div
                ref={menuRef}
                role="menu"
                aria-label={t.addAttachment}
                className="absolute bottom-full left-0 mb-2 w-44 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {/* Photos option */}
                <label
                  htmlFor={photoInputId}
                  role="menuitem"
                  tabIndex={0}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-emerald-50 cursor-pointer transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && photoInputRef.current?.click()}
                >
                  <span className="text-lg">🖼️</span>
                  <span>{t.photos}</span>
                </label>
                <input
                  ref={photoInputRef}
                  id={photoInputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoInputChange}
                  aria-label={t.photos}
                />

                {/* Divider */}
                <div className="h-px bg-gray-100 mx-2" />

                {/* Camera option */}
                <label
                  htmlFor={cameraInputId}
                  role="menuitem"
                  tabIndex={0}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-emerald-50 cursor-pointer transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && cameraInputRef.current?.click()}
                >
                  <span className="text-lg">📷</span>
                  <span>{t.camera}</span>
                </label>
                <input
                  ref={cameraInputRef}
                  id={cameraInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handlePhotoInputChange}
                  aria-label={t.camera}
                />
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage ? (language === "te" ? "ఫోటో గురించి ఏదైనా అడగండి..." : "Ask about this photo... (or just send)") : t.placeholder}
              aria-label={t.placeholder}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px] transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Microphone button (Phase 4) */}
          {voiceSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              aria-label={isRecording ? t.stopRecording : t.startVoiceInput}
              title={isRecording ? t.stopRecording : t.startVoiceInput}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all border shrink-0 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 border-red-700 text-white shadow-md"
                  : "bg-gray-100 hover:bg-emerald-50 border-gray-200 hover:border-emerald-300 text-gray-600 hover:text-emerald-700"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                // Pulsing stop icon when recording
                <span className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-50 animate-ping" />
                  <svg className="w-4 h-4 relative" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </span>
              ) : (
                // Microphone icon
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>
          )}

          {/* Send button */}
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            aria-label={t.send}
            className="h-10 w-10 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-full flex items-center justify-center transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400 leading-tight">{t.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
