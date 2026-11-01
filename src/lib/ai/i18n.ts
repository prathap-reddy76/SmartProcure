export type SupportedLanguage = "en" | "te";

export interface ChatTranslation {
  title: string;
  badge: string;
  subtitle: string;
  languageLabel: string;
  newChat: string;
  welcome: string;
  placeholder: string;
  send: string;
  thinking: string;
  suggestedHeading: string;
  suggestions: string[];
  emptyError: string;
  tooLongError: string;
  networkError: string;
  missingKeyError: string;
  missingKeyHelp: string;
  disclaimer: string;
  // Phase 2 — product recommendation UI
  productsHeading: string;
  viewProduct: string;
  inStock: string;
  outOfStock: string;
  soldBy: string;
  noProductsFound: string;
  // Phase 3 — plant disease detection UI
  analyzePlant: string;
  uploadPhoto: string;
  takePhoto: string;
  changePhoto: string;
  removePhoto: string;
  analyzingPlant: string;
  analyzeButton: string;
  analysisHeading: string;
  severityLabel: string;
  confidenceLabel: string;
  symptomsLabel: string;
  recommendationsLabel: string;
  preventionLabel: string;
  expertAdviceLabel: string;
  retryAnalysis: string;
  askFollowUp: string;
  imageTooBig: string;
  imageInvalidType: string;
  imageUploadError: string;
  analysisDisclaimer: string;
  noImageSelected: string;
  diseaseProductsHeading: string;
  // Phase 3 (redesign) — composer attachment menu
  addAttachment: string;
  photos: string;
  camera: string;
  sendingImage: string;
  imageAttached: string;
  // Phase 4 — voice input
  startVoiceInput: string;
  stopRecording: string;
  listening: string;
  voiceUnsupported: string;
  micPermissionDenied: string;
  noSpeechDetected: string;
  voiceError: string;
  // Phase 4 — text-to-speech
  listenToResponse: string;
  stopSpeaking: string;
  voiceResponsesOn: string;
  voiceResponsesOff: string;
  noTeluguVoice: string;
  // Phase 5 — contextual follow-ups
  followUpHeading: string;
  // Phase 6 — live market prices & weather
  marketPricesHeading: string;
  modalPriceLabel: string;
  minPriceLabel: string;
  maxPriceLabel: string;
  mandiDisclaimer: string;
  weatherHeading: string;
  temperatureLabel: string;
  rainfallLabel: string;
  weatherDisclaimer: string;
  // Phase 7 — home dashboard weather card
  weatherCardTitle: string;
  useCurrentLocation: string;
  changeLocation: string;
  saveLocationAsDefault: string;
  locationSavedSuccess: string;
  searchLocationPlaceholder: string;
  searchLocationButton: string;
  searchingLocation: string;
  selectLocationHeading: string;
  noLocationsFound: string;
  confirmLocation: string;
  gpsDetecting: string;
  gpsPermissionDenied: string;
  gpsUnavailable: string;
  weatherUnavailable: string;
  retryButton: string;
  refreshWeather: string;
  updatedJustNow: string;
  updatedAtPrefix: string;
  feelsLikeLabel: string;
  humidityLabel: string;
  windSpeedLabel: string;
  precipitationLabel: string;
  rainProbabilityLabel: string;
  forecast3DayHeading: string;
  todayLabel: string;
  tomorrowLabel: string;
  detailedForecastLink: string;
  // Phase 8 — personalized dashboard
  farmProfileHeading: string;
  farmAreaLabel: string;
  soilTypeLabel: string;
  irrigationLabel: string;
  registeredCropsLabel: string;
  profileCompletionLabel: string;
  completeProfilePrompt: string;
  editProfileButton: string;
  notSpecifiedLabel: string;
  cropsHeading: string;
  manageCropsLink: string;
  sowingDateLabel: string;
  daysSinceSowingLabel: string;
  allocatedAreaLabel: string;
  askAiAboutCrop: string;
  noCropsRegistered: string;
  noCropsSubtext: string;
  registerCropButton: string;
  suggestionsHeading: string;
  suggestionsSubheading: string;
  weatherAdvisoryBadge: string;
  cropAdvisoryBadge: string;
  profileTipBadge: string;
  askAssistantButton: string;
  noSuggestionsAvailable: string;
  dashboardMarketHeading: string;
  dashboardMarketSubheading: string;
  viewAllMarketPrices: string;
  noCropPricesFound: string;
  noCropPricesSubtext: string;
  quickActionsHeading: string;
  actionAiAssistant: string;
  actionAiAssistantDesc: string;
  actionPlantDisease: string;
  actionPlantDiseaseDesc: string;
  actionMarketplace: string;
  actionMarketplaceDesc: string;
  actionMarketPrices: string;
  actionMarketPricesDesc: string;
  actionWeather: string;
  actionWeatherDesc: string;
  actionOrders: string;
  actionOrdersDesc: string;
  actionProfile: string;
  actionProfileDesc: string;
  recentOrdersHeading: string;
  upcomingProcurementHeading: string;
  viewAllOrders: string;
  viewAllBookings: string;
  noRecentOrders: string;
  noRecentBookings: string;
  orderTotalLabel: string;
  trackOrder: string;
  bookSlotButton: string;
  shopNowButton: string;
  recommendedProductsHeading: string;
  exploreMarketplaceLink: string;
  noProductsAvailable: string;
  browseCatalog: string;
}

export const CHAT_TRANSLATIONS: Record<SupportedLanguage, ChatTranslation> = {
  en: {
    title: "SmartProcure AI Farming Assistant",
    badge: "Agricultural AI Advisor",
    subtitle: "Ask questions about crops, soil health, irrigation schedules, fertilizers, pests, and plant diseases.",
    languageLabel: "Language",
    newChat: "New Chat",
    welcome: "Hello! I am your SmartProcure AI Farming Assistant. I can help answer your questions about crop management, soil fertility, irrigation, fertilizer recommendations, pest identification, and plant health. What would you like guidance on today?",
    placeholder: "Ask about crops, soil, water, fertilizers, pests, or diseases...",
    send: "Send",
    thinking: "AI is analyzing your farming query...",
    suggestedHeading: "Common Questions for Farmers:",
    suggestions: [
      "How can I improve my paddy yield?",
      "How often should I water my crops?",
      "What are the common diseases affecting paddy?",
      "How can I improve soil fertility?",
      "How do I identify pests affecting my crops?",
      "How should I choose fertilizer for my crop?",
    ],
    emptyError: "Please enter your question before sending.",
    tooLongError: "Your question is too long. Please keep it under 1,000 characters.",
    networkError: "Unable to connect to the AI Farming Assistant. Please check your internet connection and try again.",
    missingKeyError: "Gemini AI is not yet configured on this system.",
    missingKeyHelp: "To enable the AI Farming Assistant, please add GEMINI_API_KEY to your .env.local file.",
    disclaimer: "AI guidance provides general agricultural information. Always verify chemical rates on product labels and consult your local agricultural extension officer (AEO) or Krishi Vigyan Kendra (KVK).",
    productsHeading: "Matching Products in SmartProcure Marketplace",
    viewProduct: "View Product",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    soldBy: "Sold by",
    noProductsFound: "No matching products found in the current catalog. Browse the Marketplace for all available inputs.",
    // Phase 3 — plant disease detection
    analyzePlant: "Analyze Plant",
    uploadPhoto: "Upload Plant Photo",
    takePhoto: "Take Photo",
    changePhoto: "Change Photo",
    removePhoto: "Remove",
    analyzingPlant: "AI is analyzing your plant photo...",
    analyzeButton: "Analyze Plant Disease",
    analysisHeading: "Plant Disease Analysis",
    severityLabel: "Severity",
    confidenceLabel: "Confidence",
    symptomsLabel: "Observed Symptoms",
    recommendationsLabel: "Recommended Actions",
    preventionLabel: "Preventive Measures",
    expertAdviceLabel: "Expert Consultation",
    retryAnalysis: "Retry Analysis",
    askFollowUp: "Ask Follow-up Question",
    imageTooBig: "Image is too large. Please use an image under 5 MB.",
    imageInvalidType: "Unsupported file type. Please upload a JPEG, PNG, or WebP image.",
    imageUploadError: "Failed to upload the image. Please try again.",
    analysisDisclaimer: "This is an AI-assisted preliminary assessment only. Consult a qualified Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) for a confirmed diagnosis before applying any treatment.",
    noImageSelected: "Please select or capture a plant image first.",
    diseaseProductsHeading: "Relevant Products for This Diagnosis",
    // Phase 3 (redesign) — composer attachment menu
    addAttachment: "Add attachment",
    photos: "Photos",
    camera: "Camera",
    sendingImage: "AI is analyzing your plant photo...",
    imageAttached: "Plant photo attached",
    // Phase 4 — voice input
    startVoiceInput: "Start voice input",
    stopRecording: "Stop recording",
    listening: "Listening… speak now",
    voiceUnsupported: "Voice input is not supported in this browser.",
    micPermissionDenied: "Microphone permission was denied. Please allow microphone access in your browser settings.",
    noSpeechDetected: "No speech detected. Please try again.",
    voiceError: "Voice input error. Please try again.",
    // Phase 4 — text-to-speech
    listenToResponse: "Listen to this response",
    stopSpeaking: "Stop speaking",
    voiceResponsesOn: "Auto-speak is on",
    voiceResponsesOff: "Auto-speak is off",
    noTeluguVoice: "Telugu voice not available on this device. Using default voice.",
    // Phase 5 — contextual follow-ups
    followUpHeading: "Suggested Follow-ups:",
    // Phase 6 — live market prices & weather
    marketPricesHeading: "Mandi Market Prices",
    modalPriceLabel: "Modal Price",
    minPriceLabel: "Min Price",
    maxPriceLabel: "Max Price",
    mandiDisclaimer: "Reported mandi prices are daily wholesale arrival rates and do not guarantee a fixed sale price.",
    weatherHeading: "Agricultural Weather Observation",
    temperatureLabel: "Temperature",
    rainfallLabel: "Rainfall",
    weatherDisclaimer: "Weather observations and forecasts are indicative. Verify conditions locally for critical field operations.",
    // Phase 7 — home dashboard weather card
    weatherCardTitle: "Local Agricultural Weather",
    useCurrentLocation: "Use My Current Location",
    changeLocation: "Change Location",
    saveLocationAsDefault: "Save as My Location",
    locationSavedSuccess: "Saved as default weather location",
    searchLocationPlaceholder: "Enter village, town, or district (e.g. Adoni, Guntur)",
    searchLocationButton: "Search",
    searchingLocation: "Searching location...",
    selectLocationHeading: "Select Matching Location",
    noLocationsFound: "No matching locations found. Try checking spelling or enter a nearby district.",
    confirmLocation: "Confirm & Set Location",
    gpsDetecting: "Detecting GPS location...",
    gpsPermissionDenied: "Location permission was denied. Please search or select your village or district manually.",
    gpsUnavailable: "Unable to detect GPS position. Please enter your location manually.",
    weatherUnavailable: "Weather information is temporarily unavailable.",
    retryButton: "Retry",
    refreshWeather: "Refresh Weather",
    updatedJustNow: "Updated just now",
    updatedAtPrefix: "Updated",
    feelsLikeLabel: "Feels like",
    humidityLabel: "Humidity",
    windSpeedLabel: "Wind",
    precipitationLabel: "Precipitation",
    rainProbabilityLabel: "Rain Chance",
    forecast3DayHeading: "3-Day Agricultural Forecast",
    todayLabel: "Today",
    tomorrowLabel: "Tomorrow",
    detailedForecastLink: "View Detailed Weather Forecast",
    // Phase 8 — personalized dashboard
    farmProfileHeading: "Farm Profile Summary",
    farmAreaLabel: "Total Farm Area",
    soilTypeLabel: "Soil / Land Type",
    irrigationLabel: "Irrigation Method",
    registeredCropsLabel: "Registered Crops",
    profileCompletionLabel: "Profile Completion",
    completeProfilePrompt: "Complete your farm profile for personalized agronomic guidance and accurate advisories.",
    editProfileButton: "Edit Farm Profile",
    notSpecifiedLabel: "Not specified",
    cropsHeading: "My Registered Crops",
    manageCropsLink: "Manage Crops",
    sowingDateLabel: "Sown on",
    daysSinceSowingLabel: "days since sowing",
    allocatedAreaLabel: "Allocated",
    askAiAboutCrop: "Ask AI About This Crop",
    noCropsRegistered: "No crops registered yet",
    noCropsSubtext: "Register your cultivated crops to receive tailored disease advisories, water schedules, and live mandi prices.",
    registerCropButton: "Register a Crop",
    suggestionsHeading: "Suggestions for Your Farm",
    suggestionsSubheading: "Actionable agricultural guidance grounded in your crops, farm location, and weather conditions.",
    weatherAdvisoryBadge: "Weather Advisory",
    cropAdvisoryBadge: "Crop Management",
    profileTipBadge: "Profile Tip",
    askAssistantButton: "Ask AI Assistant",
    noSuggestionsAvailable: "Provide crop and farm details to receive personalized farming suggestions.",
    dashboardMarketHeading: "Mandi Rates for Your Crops",
    dashboardMarketSubheading: "Daily reported APMC wholesale arrival prices for your cultivated crops.",
    viewAllMarketPrices: "View All Market Rates",
    noCropPricesFound: "No live mandi quotes available for your registered crops today.",
    noCropPricesSubtext: "Check all available markets or browse regional APMC arrivals.",
    quickActionsHeading: "Quick Actions",
    actionAiAssistant: "AI Farming Assistant",
    actionAiAssistantDesc: "Ask agricultural questions",
    actionPlantDisease: "Plant Disease Analysis",
    actionPlantDiseaseDesc: "Scan leaf photos for diagnosis",
    actionMarketplace: "Browse Agri Products",
    actionMarketplaceDesc: "Seeds, fertilizers & tools",
    actionMarketPrices: "Live Mandi Prices",
    actionMarketPricesDesc: "APMC wholesale quotes",
    actionWeather: "Weather & Forecast",
    actionWeatherDesc: "7-day rain & wind outlook",
    actionOrders: "My Orders",
    actionOrdersDesc: "Track delivery status",
    actionProfile: "Farm Profile",
    actionProfileDesc: "Update farm & soil details",
    recentOrdersHeading: "Recent Orders & Bookings",
    upcomingProcurementHeading: "Upcoming Procurement Slots",
    viewAllOrders: "View All Orders",
    viewAllBookings: "View All Bookings",
    noRecentOrders: "No recent marketplace orders.",
    noRecentBookings: "No active procurement bookings.",
    orderTotalLabel: "Total Amount",
    trackOrder: "Track Order",
    bookSlotButton: "Book Procurement Slot",
    shopNowButton: "Shop Marketplace",
    recommendedProductsHeading: "Recommended For Your Farm",
    exploreMarketplaceLink: "Explore Marketplace",
    noProductsAvailable: "Browse our marketplace for certified seeds, fertilizers, and tools.",
    browseCatalog: "Browse Catalog",
  },
  te: {
    title: "SmartProcure AI వ్యవసాయ సహాయకుడు",
    badge: "వ్యవసాయ AI సలహాదారు",
    subtitle: "పంటలు, నేల ఆరోగ్యం, నీటి పారుదల, ఎరువులు, తెగుళ్లు మరియు మొక్కల వ్యాధుల గురించి సలహాలు పొందండి.",
    languageLabel: "భాష",
    newChat: "కొత్త సంభాషణ",
    welcome: "నమస్కారం! నేను మీ SmartProcure AI వ్యవసాయ సహాయకుడిని. పంటల నిర్వహణ, నేల సారవంతం, నీటి పారుదల, ఎరువుల ఎంపిక, తెగుళ్ల గుర్తింపు మరియు మొక్కల ఆరోగ్య సమస్యల గురించి నేను మీకు సహాయపడగలను. ఈరోజు మీ వ్యవసాయానికి ఏ సమాచారం కావాలి?",
    placeholder: "పంటలు, నేల, నీరు, ఎరువులు, తెగుళ్లు లేదా వ్యాధుల గురించి అడగండి...",
    send: "పంపండి",
    thinking: "AI మీ వ్యవసాయ ప్రశ్నకు సమాధానం సిద్ధం చేస్తోంది...",
    suggestedHeading: "రైతులు ఎక్కువగా అడిగే ప్రశ్నలు:",
    suggestions: [
      "వరి దిగుబడిని ఎలా పెంచుకోవచ్చు?",
      "పంటలకు ఎంత తరచుగా నీరు పెట్టాలి?",
      "వరి పంటను ఆశించే ప్రధాన తెగుళ్లు/వ్యాధులు ఏమిటి?",
      "నేల సారవంతాన్ని ఎలా పెంచాలి?",
      "పంటను ఆశించే తెగుళ్లను ఎలా గుర్తించాలి?",
      "నా పంటకు సరైన ఎరువును ఎలా ఎంచుకోవాలి?",
    ],
    emptyError: "దయచేసి మీ ప్రశ్నను నమోదు చేయండి.",
    tooLongError: "మీ ప్రశ్న చాలా పెద్దదిగా ఉంది. దయచేసి 1,000 అక్షరాల లోపు అడగండి.",
    networkError: "AI వ్యవసాయ సహాయకుడిని చేరుకోలేకపోయాము. దయచేసి మీ ఇంటర్నెట్ కనెక్షన్‌ని సరిచూసి మళ్లీ ప్రయత్నించండి.",
    missingKeyError: "ఈ సిస్టమ్‌లో Gemini AI ఇంకా కాన్ఫిగర్ చేయబడలేదు.",
    missingKeyHelp: "AI వ్యవసాయ సహాయకుడిని ప్రారంభించడానికి, దయచేసి .env.local ఫైల్‌లో GEMINI_API_KEY ని జోడించండి.",
    disclaimer: "AI సమాచారం సాధారణ అవగాహన కోసం మాత్రమే. రసాయన మందుల వాడకానికి ముందు లేబుల్ సూచనలను చదవండి మరియు స్థానిక వ్యవసాయ అధికారి (AEO) లేదా కృషి విజ్ఞాన కేంద్రాన్ని (KVK) సంప్రదించండి.",
    productsHeading: "SmartProcure మార్కెట్‌ప్లేస్‌లో సరిపోలే ఉత్పత్తులు",
    viewProduct: "ఉత్పత్తి వివరాలు చూడండి",
    inStock: "స్టాక్‌లో ఉంది",
    outOfStock: "స్టాక్ అయిపోయింది",
    soldBy: "విక్రేత",
    noProductsFound: "ప్రస్తుత కేటలాగ్‌లో సరిపోలే ఉత్పత్తులు కనుగొనబడలేదు. అందుబాటులో ఉన్న అన్ని వస్తువుల కోసం మార్కెట్‌ప్లేస్‌ని బ్రౌజ్ చేయండి.",
    // Phase 3 — plant disease detection (Telugu)
    analyzePlant: "మొక్కను విశ్లేషించండి",
    uploadPhoto: "మొక్క ఫోటో అప్‌లోడ్ చేయండి",
    takePhoto: "ఫోటో తీయండి",
    changePhoto: "ఫోటో మార్చండి",
    removePhoto: "తొలగించండి",
    analyzingPlant: "AI మీ మొక్క ఫోటోను విశ్లేషిస్తోంది...",
    analyzeButton: "మొక్క వ్యాధిని విశ్లేషించండి",
    analysisHeading: "మొక్క వ్యాధి విశ్లేషణ",
    severityLabel: "తీవ్రత",
    confidenceLabel: "నిశ్చయత",
    symptomsLabel: "గమనించిన లక్షణాలు",
    recommendationsLabel: "సిఫార్సు చేయబడిన చర్యలు",
    preventionLabel: "నివారణ చర్యలు",
    expertAdviceLabel: "నిపుణుల సలహా",
    retryAnalysis: "మళ్ళీ విశ్లేషించండి",
    askFollowUp: "అదనపు ప్రశ్న అడగండి",
    imageTooBig: "చిత్రం చాలా పెద్దదిగా ఉంది. దయచేసి 5 MB కంటే తక్కువ పరిమాణం గల చిత్రాన్ని ఉపయోగించండి.",
    imageInvalidType: "మద్దతు లేని ఫైల్ రకం. దయచేసి JPEG, PNG, లేదా WebP చిత్రాన్ని అప్‌లోడ్ చేయండి.",
    imageUploadError: "చిత్రాన్ని అప్‌లోడ్ చేయడం విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    analysisDisclaimer: "ఇది AI సహాయంతో చేసిన తాత్కాలిక అంచనా మాత్రమే. ఏదైనా చికిత్స చేయడానికి ముందు స్థానిక వ్యవసాయ విస్తరణ అధికారి (AEO) లేదా కృషి విజ్ఞాన కేంద్రం (KVK)ని సంప్రదించండి.",
    noImageSelected: "దయచేసి ముందుగా మొక్క చిత్రాన్ని ఎంచుకోండి లేదా తీయండి.",
    diseaseProductsHeading: "ఈ రోగనిర్ధారణకు సంబంధిత ఉత్పత్తులు",
    // Phase 3 (redesign) — composer attachment menu
    addAttachment: "జోడింపు జోడించండి",
    photos: "ఫోటోలు",
    camera: "కెమెరా",
    sendingImage: "AI మీ మొక్క ఫోటోను విశ్లేషిస్తోంది...",
    imageAttached: "మొక్క ఫోటో జోడించబడింది",
    // Phase 4 — voice input
    startVoiceInput: "వాయిస్ ఇన్‌పుట్ ప్రారంభించండి",
    stopRecording: "రికార్డింగ్ ఆపండి",
    listening: "వింటున్నాను… మాట్లాడండి",
    voiceUnsupported: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ మద్దతు లేదు.",
    micPermissionDenied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి మీ బ్రౌజర్ సెట్టింగ్స్‌లో మైక్రోఫోన్ యాక్సెస్ అనుమతించండి.",
    noSpeechDetected: "మాట్లాడటం గుర్తించబడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    voiceError: "వాయిస్ ఇన్‌పుట్ లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
    // Phase 4 — text-to-speech
    listenToResponse: "ఈ సమాధానం వినండి",
    stopSpeaking: "మాట్లాడడం ఆపండి",
    voiceResponsesOn: "ఆటో-స్పీక్ ఆన్ చేయబడింది",
    voiceResponsesOff: "ఆటో-స్పీక్ ఆఫ్ చేయబడింది",
    noTeluguVoice: "ఈ పరికరంలో తెలుగు వాయిస్ అందుబాటులో లేదు. డిఫాల్ట్ వాయిస్ ఉపయోగిస్తోంది.",
    // Phase 5 — contextual follow-ups
    followUpHeading: "సంబంధిత తదుపరి ప్రశ్నలు:",
    // Phase 6 — live market prices & weather
    marketPricesHeading: "మండీ మార్కెట్ ధరలు",
    modalPriceLabel: "మోడల్ ధర",
    minPriceLabel: "కనిష్ట ధర",
    maxPriceLabel: "గరిష్ట ధర",
    mandiDisclaimer: "నివేదించబడిన మండీ ధరలు రోజువారీ హోల్‌సేల్ మార్కెట్ ధరలు మాత్రమే; అవి నిర్దిష్ట విక్రయ ధరకు హామీ ఇవ్వవు.",
    weatherHeading: "వ్యవసాయ వాతావరణ సమాచారం",
    temperatureLabel: "ఉష్ణోగ్రత",
    rainfallLabel: "వర్షపాతం",
    weatherDisclaimer: "వాతావరణ సమాచారం మరియు సూచనలు సూచనాత్మకమైనవి. పంటలపై మందుల పిచికారీ వంటి సమయాల్లో స్థానిక వాతావరణాన్ని గమనించండి.",
    // Phase 7 — home dashboard weather card (Telugu)
    weatherCardTitle: "స్థానిక వ్యవసాయ వాతావరణం",
    useCurrentLocation: "నా ప్రస్తుత లొకేషన్ ఉపయోగించండి",
    changeLocation: "లొకేషన్ మార్చండి",
    saveLocationAsDefault: "నా లొకేషన్‌గా సేవ్ చేయండి",
    locationSavedSuccess: "డిఫాల్ట్ వాతావరణ లొకేషన్‌గా సేవ్ చేయబడింది",
    searchLocationPlaceholder: "గ్రామం, పట్టణం లేదా జిల్లా నమోదు చేయండి (ఉదా: ఆదోని, గుంటూరు)",
    searchLocationButton: "వెతకండి",
    searchingLocation: "లొకేషన్ వెతుకుతోంది...",
    selectLocationHeading: "సరిపోలే లొకేషన్‌ను ఎంచుకోండి",
    noLocationsFound: "సరిపోలే లొకేషన్లు కనుగొనబడలేదు. అక్షరక్రమాన్ని సరిచూడండి లేదా సమీప జిల్లాను నమోదు చేయండి.",
    confirmLocation: "నిర్ధారించి సెట్ చేయండి",
    gpsDetecting: "GPS లొకేషన్ గుర్తిస్తోంది...",
    gpsPermissionDenied: "లొకేషన్ అనుమతి నిరాకరించబడింది. మీరు మీ గ్రామం లేదా జిల్లాను మాన్యువల్‌గా శోధించవచ్చు.",
    gpsUnavailable: "GPS స్థానాన్ని గుర్తించలేకపోయాము. దయచేసి మీ లొకేషన్‌ను మాన్యువల్‌గా నమోదు చేయండి.",
    weatherUnavailable: "వాతావరణ సమాచారం తాత్కాలికంగా అందుబాటులో లేదు.",
    retryButton: "మళ్లీ ప్రయత్నించండి",
    refreshWeather: "వాతావరణం రిఫ్రెష్ చేయండి",
    updatedJustNow: "ఇప్పుడే అప్‌డేట్ చేయబడింది",
    updatedAtPrefix: "అప్‌డేట్ చేయబడింది",
    feelsLikeLabel: "అనిపించే ఉష్ణోగ్రత",
    humidityLabel: "తేమ",
    windSpeedLabel: "గాలి వేగం",
    precipitationLabel: "వర్షపాతం",
    rainProbabilityLabel: "వర్ష సూచన",
    forecast3DayHeading: "3 రోజుల వ్యవసాయ వాతావరణ సూచన",
    todayLabel: "ఈరోజు",
    tomorrowLabel: "రేపు",
    detailedForecastLink: "వివరమైన వాతావరణ సమాచారం చూడండి",
    // Phase 8 — personalized dashboard (Telugu)
    farmProfileHeading: "వ్యవసాయ ప్రొఫైల్ వివరాలు",
    farmAreaLabel: "మొత్తం పొలం విస్తీర్ణం",
    soilTypeLabel: "నేల రకం",
    irrigationLabel: "నీటి పారుదల విధానం",
    registeredCropsLabel: "నమోదైన పంటలు",
    profileCompletionLabel: "ప్రొఫైల్ పూర్తి స్థితి",
    completeProfilePrompt: "ఖచ్చితమైన వ్యవసాయ సలహాలు పొందడానికి మీ పొలం వివరాలను పూర్తి చేయండి.",
    editProfileButton: "ప్రొఫైల్ సవరించండి",
    notSpecifiedLabel: "నమోదు చేయలేదు",
    cropsHeading: "నా నమోదిత పంటలు",
    manageCropsLink: "పంటల నిర్వహణ",
    sowingDateLabel: "విత్తిన తేదీ",
    daysSinceSowingLabel: "రోజులు గడిచాయి",
    allocatedAreaLabel: "విస్తీర్ణం",
    askAiAboutCrop: "ఈ పంట గురించి AI ని అడగండి",
    noCropsRegistered: "పంటలు ఇంకా నమోదు కాలేదు",
    noCropsSubtext: "పంటలను నమోదు చేయడం ద్వారా తెగుళ్ల సలహాలు, నీటి నిర్వహణ మరియు ప్రత్యక్ష మార్కెట్ ధరలను పొందండి.",
    registerCropButton: "పంటను నమోదు చేయండి",
    suggestionsHeading: "మీ వ్యవసాయానికి సూచనలు",
    suggestionsSubheading: "మీ పంటలు, పొలం స్థానం మరియు వాతావరణం ఆధారంగా వ్యవసాయ సలహాలు.",
    weatherAdvisoryBadge: "వాతావరణ హెచ్చరిక",
    cropAdvisoryBadge: "పంట నిర్వహణ",
    profileTipBadge: "ప్రొఫైల్ సూచన",
    askAssistantButton: "AI సహాయకుడిని అడగండి",
    noSuggestionsAvailable: "వ్యక్తిగత సూచనలు పొందడానికి మీ పంట మరియు పొలం వివరాలను అందించండి.",
    dashboardMarketHeading: "మీ పంటల మండీ ధరలు",
    dashboardMarketSubheading: "మీరు సాగు చేస్తున్న పంటలకు APMC హోల్‌సేల్ మార్కెట్ ధరలు.",
    viewAllMarketPrices: "అన్ని మార్కెట్ ధరలు చూడండి",
    noCropPricesFound: "మీ నమోదిత పంటలకు నేటి మండీ ధరలు అందుబాటులో లేవు.",
    noCropPricesSubtext: "అన్ని మార్కెట్ ధరలు లేదా సమీప APMC మార్కెట్లను తనిఖీ చేయండి.",
    quickActionsHeading: "త్వరిత సేవలు",
    actionAiAssistant: "AI వ్యవసాయ సహాయకుడు",
    actionAiAssistantDesc: "వ్యవసాయ ప్రశ్నలు అడగండి",
    actionPlantDisease: "మొక్కల వ్యాధి విశ్లేషణ",
    actionPlantDiseaseDesc: "ఆకుల ఫోటోతో వ్యాధి గుర్తింపు",
    actionMarketplace: "వ్యవసాయ ఉత్పత్తులు",
    actionMarketplaceDesc: "విత్తనాలు, ఎరువులు & పరికరాలు",
    actionMarketPrices: "లైవ్ మార్కెట్ ధరలు",
    actionMarketPricesDesc: "APMC హోల్‌సేల్ ధరలు",
    actionWeather: "వాతావరణ సమాచారం",
    actionWeatherDesc: "7 రోజుల వర్షం & గాలి సమాచారం",
    actionOrders: "నా ఆర్డర్లు",
    actionOrdersDesc: "డెలివరీ స్థితిని ట్రాక్ చేయండి",
    actionProfile: "వ్యవసాయ ప్రొఫైల్",
    actionProfileDesc: "పొలం & నేల వివరాలు నవీకరించండి",
    recentOrdersHeading: "ఇటీవలి ఆర్డర్లు & బుకింగ్‌లు",
    upcomingProcurementHeading: "రాబోయే కొనుగోలు స్లాట్‌లు",
    viewAllOrders: "అన్ని ఆర్డర్లు చూడండి",
    viewAllBookings: "అన్ని బుకింగ్‌లు చూడండి",
    noRecentOrders: "ఇటీవలి ఆర్డర్లు లేవు.",
    noRecentBookings: "క్రియాశీల కొనుగోలు బుకింగ్‌లు లేవు.",
    orderTotalLabel: "మొత్తం ధర",
    trackOrder: "ట్రాక్ చేయండి",
    bookSlotButton: "కొనుగోలు స్లాట్ బుక్ చేయండి",
    shopNowButton: "మార్కెట్‌ప్లేస్‌లో కొనండి",
    recommendedProductsHeading: "మీ పొలానికి సరిపోలే ఉత్పత్తులు",
    exploreMarketplaceLink: "మార్కెట్‌ప్లేస్‌ని అన్వేషించండి",
    noProductsAvailable: "ప్రామాణిక విత్తనాలు, ఎరువుల కోసం మార్కెట్‌ప్లేస్‌ని బ్రౌజ్ చేయండి.",
    browseCatalog: "కేటలాగ్ బ్రౌజ్ చేయండి",
  },
};
