/**
 * SmartProcure AI — Phase 5: Intelligent Contextual Follow-up Suggestions
 *
 * Generates relevant follow-up questions based on the content of the assistant's
 * response and the active language (English or Telugu).
 *
 * Pure, deterministic function: zero API cost, zero network overhead.
 */

import { SupportedLanguage } from "./i18n";

export interface SuggestionContext {
  lastAssistantMessage: string;
  language: SupportedLanguage;
  hasProducts?: boolean;
}

/**
 * Generate 3–4 contextually relevant follow-up questions based on the assistant's response.
 */
export function generateFollowUpSuggestions({
  lastAssistantMessage,
  language,
  hasProducts = false,
}: SuggestionContext): string[] {
  if (!lastAssistantMessage || lastAssistantMessage.trim() === "") {
    return [];
  }

  const lower = lastAssistantMessage.toLowerCase();
  const isTelugu = language === "te";

  // Case 1: Product recommendations were returned
  if (hasProducts) {
    if (isTelugu) {
      return [
        "ఈ ఉత్పత్తిని ఎలా ఉపయోగించాలి మరియు మోతాదు ఎంత?",
        "పిచికారీ చేసేటప్పుడు ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?",
        "సేంద్రీయ లేదా సహజ ప్రత్యామ్నాయాలు ఏమైనా ఉన్నాయా?",
      ];
    }
    return [
      "How should I apply this product and what is the dosage?",
      "What safety precautions should I take while spraying?",
      "Are there any organic or non-chemical alternatives?",
    ];
  }

  // Case 2: Plant disease, pest, or symptoms discussed
  const isDiseaseOrPest =
    lower.includes("disease") ||
    lower.includes("pest") ||
    lower.includes("fungal") ||
    lower.includes("bacterial") ||
    lower.includes("blight") ||
    lower.includes("blast") ||
    lower.includes("spot") ||
    lower.includes("rot") ||
    lower.includes("wilt") ||
    lower.includes("aphid") ||
    lower.includes("mite") ||
    lower.includes("infestation") ||
    lower.includes("chlorosis") ||
    lower.includes("deficiency") ||
    lower.includes("లక్షణాలు") ||
    lower.includes("వ్యాధి") ||
    lower.includes("తెగులు") ||
    lower.includes("పురుగు");

  if (isDiseaseOrPest) {
    if (isTelugu) {
      return [
        "నేను తర్వాత ఏ లక్షణాలను గమనించాలి?",
        "భవిష్యత్తులో ఈ సమస్య రాకుండా ఎలా నివారించాలి?",
        "మార్కెట్‌ప్లేస్‌లో సరిపోయే ఉత్పత్తులు ఉన్నాయా?",
        "రసాయన మందులు వాడకుండా సహజ నివారణ ఎలా?",
      ];
    }
    return [
      "What symptoms should I check next?",
      "How can I prevent this problem in the future?",
      "Which relevant products are available in the marketplace?",
      "Are there non-chemical or organic remedies?",
    ];
  }

  // Case 3: Fertilizer, soil, or nutrition discussed
  const isFertilizerOrSoil =
    lower.includes("fertilizer") ||
    lower.includes("urea") ||
    lower.includes("npk") ||
    lower.includes("dap") ||
    lower.includes("nutrient") ||
    lower.includes("nitrogen") ||
    lower.includes("potassium") ||
    lower.includes("soil") ||
    lower.includes("compost") ||
    lower.includes("ఎరువు") ||
    lower.includes("నేల") ||
    lower.includes("పోషక");

  if (isFertilizerOrSoil) {
    if (isTelugu) {
      return [
        "ఎకరాకు ఎంత మోతాదులో వాడాలి?",
        "ఈ ఎరువు వేయడానికి సరైన సమయం ఏది?",
        "మార్కెట్‌ప్లేస్‌లో ఏ ఎరువులు అందుబాటులో ఉన్నాయి?",
        "సేంద్రీయ ఎరువులను ఎలా కలపవచ్చు?",
      ];
    }
    return [
      "What is the recommended dosage per acre?",
      "When is the best time or stage to apply this?",
      "Which fertilizer products are available in the marketplace?",
      "How can I integrate organic manure or compost?",
    ];
  }

  // Case 4: Irrigation or water management discussed
  const isWaterOrIrrigation =
    lower.includes("water") ||
    lower.includes("irrigation") ||
    lower.includes("moisture") ||
    lower.includes("drip") ||
    lower.includes("నీరు") ||
    lower.includes("నీటి");

  if (isWaterOrIrrigation) {
    if (isTelugu) {
      return [
        "పంట కీలకమైన నీటి పారుదల దశలు ఏమిటి?",
        "ఎక్కువ నీరు నిల్వ ఉంటే ఏం చేయాలి?",
        "బిందు సేద్యం (Drip) ద్వారా ఎరువులు ఎలా ఇవ్వాలి?",
      ];
    }
    return [
      "What are the critical watering stages for this crop?",
      "How do I prevent waterlogging in the field?",
      "Can this be managed with drip fertigation?",
    ];
  }

  // Case 5: General agricultural advice fallback
  if (isTelugu) {
    return [
      "దీనిపై మరిన్ని వివరాలు ఇవ్వగలరా?",
      "నా పంట దశ ప్రకారం తదుపరి చర్యలు ఏమిటి?",
      "దీనికి సంబంధించిన ఉత్పత్తులు ఏమైనా ఉన్నాయా?",
    ];
  }

  return [
    "What symptoms should I check next?",
    "How can I prevent this problem?",
    "Which relevant products are available in the marketplace?",
    "Can you explain this in Telugu?",
  ];
}
