/**
 * SmartProcure — Farmer Dashboard Utilities
 *
 * Pure helper functions for profile completeness, days since sowing,
 * and dynamic farming suggestions. Free of "use server" RPC requirements.
 */

export interface ProfileMissingField {
  field: string;
  labelEn: string;
  labelTe: string;
  editUrl: string;
}

export interface ProfileCompletenessResult {
  percentage: number;
  missingFields: ProfileMissingField[];
}

export interface FarmerProfileSummary {
  name: string;
  phone: string | null;
  email: string | null;
  location: string;
  village: string | null;
  district: string | null;
  state: string | null;
  farmName: string | null;
  farmSize: number | null;
  farmSizeUnit: string;
  landType: string | null;
  irrigationType: string | null;
  primaryCrop: string | null;
  cropsCount: number;
  completionPercentage: number;
  missingFields: ProfileMissingField[];
}

export interface FarmerDashboardCropItem {
  id: string;
  cropName: string;
  variety: string | null;
  area: number | null;
  areaUnit: string;
  season: string | null;
  plantingDate: string | null;
  daysSinceSowing: number | null;
  harvestDate: string | null;
  askAiQuery: string;
}

export interface FarmingSuggestionItem {
  id: string;
  category: "WEATHER" | "CROP" | "PROFILE";
  title: string;
  titleTe: string;
  description: string;
  descriptionTe: string;
  actionUrl: string;
  actionLabel: string;
  actionLabelTe: string;
}

/**
 * Calculates profile completeness score (0-100%) and identifies missing fields
 * using a transparent 7-milestone formula.
 */
export function calculateProfileCompleteness(params: {
  name?: string | null;
  phone?: string | null;
  villageOrDistrict?: string | null;
  farmSize?: number | null;
  landType?: string | null;
  irrigationType?: string | null;
  cropsCount: number;
}): ProfileCompletenessResult {
  let score = 0;
  const missingFields: ProfileMissingField[] = [];

  // 1. Full name (15%)
  if (params.name && params.name.trim().length > 0) {
    score += 15;
  } else {
    missingFields.push({
      field: "name",
      labelEn: "Full Name",
      labelTe: "పూర్తి పేరు",
      editUrl: "/farmer/profile/edit",
    });
  }

  // 2. Phone number (15%)
  if (params.phone && params.phone.trim().length > 0) {
    score += 15;
  } else {
    missingFields.push({
      field: "phone",
      labelEn: "Phone Number",
      labelTe: "ఫోన్ నంబర్",
      editUrl: "/farmer/profile/edit",
    });
  }

  // 3. Location (Village or District) (20%)
  if (params.villageOrDistrict && params.villageOrDistrict.trim().length > 0) {
    score += 20;
  } else {
    missingFields.push({
      field: "location",
      labelEn: "Village or District",
      labelTe: "గ్రామం లేదా జిల్లా",
      editUrl: "/farmer/profile/edit",
    });
  }

  // 4. Farm Size (15%)
  if (params.farmSize && params.farmSize > 0) {
    score += 15;
  } else {
    missingFields.push({
      field: "farmSize",
      labelEn: "Total Farm Area",
      labelTe: "పొలం విస్తీర్ణం",
      editUrl: "/farmer/farm/edit",
    });
  }

  // 5. Land / Soil Type (15%)
  if (params.landType && params.landType.trim().length > 0) {
    score += 15;
  } else {
    missingFields.push({
      field: "landType",
      labelEn: "Soil / Land Type",
      labelTe: "నేల రకం",
      editUrl: "/farmer/farm/edit",
    });
  }

  // 6. Irrigation Method (10%)
  if (params.irrigationType && params.irrigationType.trim().length > 0) {
    score += 10;
  } else {
    missingFields.push({
      field: "irrigationType",
      labelEn: "Irrigation Method",
      labelTe: "నీటి పారుదల విధానం",
      editUrl: "/farmer/farm/edit",
    });
  }

  // 7. Registered Crops (10%)
  if (params.cropsCount > 0) {
    score += 10;
  } else {
    missingFields.push({
      field: "crops",
      labelEn: "Registered Crops",
      labelTe: "పంటల నమోదు",
      editUrl: "/farmer/crops",
    });
  }

  return {
    percentage: Math.min(100, Math.max(0, score)),
    missingFields,
  };
}

/**
 * Calculates days since sowing date without fabrication.
 * Returns null if plantingDate is not provided or invalid.
 */
export function calculateDaysSinceSowing(
  plantingDate: Date | string | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!plantingDate) return null;
  const date = typeof plantingDate === "string" ? new Date(plantingDate) : plantingDate;
  if (isNaN(date.getTime())) return null;

  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcRef = Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  const diffDays = Math.floor((utcRef - utcDate) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
}

/**
 * Generates dynamic, data-driven farming suggestions based on real registered crops,
 * farm location/weather, and profile completeness gaps. Zero chemical dosage inventions.
 */
export function generateFarmSuggestions(params: {
  crops: Array<{
    cropName: string;
    variety?: string | null;
    daysSinceSowing?: number | null;
  }>;
  location?: string | null;
  missingFields: ProfileMissingField[];
}): FarmingSuggestionItem[] {
  const suggestions: FarmingSuggestionItem[] = [];

  // 1. Crop-specific management advice
  for (const crop of params.crops.slice(0, 2)) {
    const cropName = crop.cropName;
    const varietyStr = crop.variety ? ` (${crop.variety})` : "";
    const days = crop.daysSinceSowing;

    if (days !== null && days !== undefined) {
      if (days < 30) {
        suggestions.push({
          id: `crop-seedling-${cropName}`,
          category: "CROP",
          title: `Seedling Stage Care: ${cropName}${varietyStr}`,
          titleTe: `మొలక దశ సంరక్షణ: ${cropName}${varietyStr}`,
          description: `Your ${cropName} was sown ${days} days ago. Inspect early shoots for sucking pests and maintain balanced moisture without waterlogging.`,
          descriptionTe: `మీ ${cropName} విత్తి ${days} రోజులు అయ్యింది. మొలకలపై రసం పీల్చే పురుగులను గమనించండి మరియు నీరు నిలవకుండా తేమను సరిచూసుకోండి.`,
          actionUrl: `/farmer/assistant?q=${encodeURIComponent(`Seedling stage care and pest monitoring for ${cropName}${varietyStr} sown ${days} days ago`)}`,
          actionLabel: "Ask Assistant",
          actionLabelTe: "AI సహాయకుడిని అడగండి",
        });
      } else if (days < 70) {
        suggestions.push({
          id: `crop-vegetative-${cropName}`,
          category: "CROP",
          title: `Vegetative & Flowering Care: ${cropName}${varietyStr}`,
          titleTe: `పెరుగుదల మరియు పూత దశ: ${cropName}${varietyStr}`,
          description: `Your ${cropName} is at ${days} days. Ensure timely weeding, balanced top-dressing, and check under leaves for signs of fungal spots or pests.`,
          descriptionTe: `మీ ${cropName} విత్తి ${days} రోజులు అయ్యింది. కలుపు నివారణ, పోషకాల యాజమాన్యం మరియు ఆకుల అడుగున తెగుళ్ల గుర్తులను గమనించండి.`,
          actionUrl: `/farmer/assistant?q=${encodeURIComponent(`Vegetative care and fertilizer management for ${cropName}${varietyStr} at ${days} days`)}`,
          actionLabel: "Ask Assistant",
          actionLabelTe: "AI సహాయకుడిని అడగండి",
        });
      } else {
        suggestions.push({
          id: `crop-maturity-${cropName}`,
          category: "CROP",
          title: `Maturity & Pre-Harvest: ${cropName}${varietyStr}`,
          titleTe: `పరిపక్వత మరియు కోత దశ: ${cropName}${varietyStr}`,
          description: `Your ${cropName} is at ${days} days. Monitor grain/boll maturity, reduce late watering as appropriate, and prepare for clean harvest.`,
          descriptionTe: `మీ ${cropName} విత్తి ${days} రోజులు అయ్యింది. గింజ/కాయ పరిపక్వతను గమనించండి మరియు సమయానుకూల కోతకు సిద్ధం అవ్వండి.`,
          actionUrl: `/farmer/assistant?q=${encodeURIComponent(`Harvest readiness and post-harvest handling for ${cropName}${varietyStr} at ${days} days`)}`,
          actionLabel: "Ask Assistant",
          actionLabelTe: "AI సహాయకుడిని అడగండి",
        });
      }
    } else {
      suggestions.push({
        id: `crop-general-${cropName}`,
        category: "CROP",
        title: `Active Crop Advisory: ${cropName}${varietyStr}`,
        titleTe: `పంట నిర్వహణ సలహా: ${cropName}${varietyStr}`,
        description: `Get tailored guidance for your ${cropName} on nutrient management, disease prevention, and suitable organic treatments.`,
        descriptionTe: `మీ ${cropName} పంట కోసం పోషకాల నిర్వహణ, వ్యాధి నివారణ మరియు సేంద్రీయ పద్ధతుల గురించి సరైన సలహాలు పొందండి.`,
        actionUrl: `/farmer/assistant?q=${encodeURIComponent(`Best management practices and pest advisory for ${cropName}${varietyStr}`)}`,
        actionLabel: "Ask Assistant",
        actionLabelTe: "AI సహాయకుడిని అడగండి",
      });
    }
  }

  // 2. Weather Advisory
  const loc = params.location || "your farm";
  suggestions.push({
    id: "weather-spraying-check",
    category: "WEATHER",
    title: "Weather Advisory: Spraying & Irrigation",
    titleTe: "వాతావరణ హెచ్చరిక: పిచికారీ మరియు నీటి పారుదల",
    description: `Always check local wind speed and rainfall probability in ${loc} before spraying bio-fertilizers or running open-channel irrigation.`,
    descriptionTe: `${loc} ప్రాంతంలో మందుల పిచికారీ లేదా నీటి పారుదల చేసే ముందు గాలి వేగం మరియు వర్ష సూచనను తప్పక తనిఖీ చేయండి.`,
    actionUrl: "/farmer/weather",
    actionLabel: "View Weather",
    actionLabelTe: "వాతావరణం చూడండి",
  });

  // 3. Profile Completion Tip (if missing fields)
  if (params.missingFields.length > 0) {
    const firstMissing = params.missingFields[0];
    suggestions.push({
      id: `profile-complete-${firstMissing.field}`,
      category: "PROFILE",
      title: `Profile Tip: Add ${firstMissing.labelEn}`,
      titleTe: `ప్రొఫైల్ సూచన: ${firstMissing.labelTe} నమోదు చేయండి`,
      description: `Complete your farm details (${firstMissing.labelEn}) to receive more accurate AI recommendations and custom mandi alerts.`,
      descriptionTe: `మరింత ఖచ్చితమైన AI సలహాలు మరియు మార్కెట్ ధరలను పొందడానికి మీ వ్యవసాయ వివరాలను (${firstMissing.labelTe}) పూర్తి చేయండి.`,
      actionUrl: firstMissing.editUrl,
      actionLabel: "Update Profile",
      actionLabelTe: "ప్రొఫైల్ అప్‌డేట్ చేయండి",
    });
  }

  // 4. If no crops registered yet, add prompt to register crops
  if (params.crops.length === 0) {
    suggestions.unshift({
      id: "register-first-crop",
      category: "CROP",
      title: "Add Cultivated Crops to Your Farm",
      titleTe: "మీ పొలంలో సాగు చేస్తున్న పంటలను నమోదు చేయండి",
      description: "Record your crops to unlock stage-specific pest alerts, watering schedules, and live APMC mandi prices on your dashboard.",
      descriptionTe: "పంటలను నమోదు చేయడం ద్వారా తెగుళ్ల హెచ్చరికలు, నీటి నిర్వహణ మరియు ప్రత్యక్ష మార్కెట్ ధరలను మీ డ్యాష్‌బోర్డ్‌లో పొందండి.",
      actionUrl: "/farmer/crops",
      actionLabel: "Register Crops",
      actionLabelTe: "పంటలను నమోదు చేయండి",
    });
  }

  return suggestions;
}
