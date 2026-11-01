/**
 * Machinery Specifications Configuration & Helpers
 * Supports dynamic specifications for all 10 agricultural machinery types.
 */

export type MachineTypeKey =
  | "TRACTOR"
  | "ROTAVATOR"
  | "PLOUGH"
  | "POWER_TILLER"
  | "HYDRAULIC_TRUCK"
  | "HARVESTER"
  | "CULTIVATOR"
  | "SEED_DRILL"
  | "TRAILER"
  | "OTHER";

export interface MachineTypeDefinition {
  key: MachineTypeKey;
  label: string;
  categorySlug: string;
  icon: string;
  tagline: string;
}

export const MACHINE_TYPES: MachineTypeDefinition[] = [
  {
    key: "TRACTOR",
    label: "Tractor",
    categorySlug: "tractor",
    icon: "🚜",
    tagline: "Multi-purpose agricultural tractors for ploughing, tilling, and haulage.",
  },
  {
    key: "ROTAVATOR",
    label: "Rotavator",
    categorySlug: "rotavator",
    icon: "⚙️",
    tagline: "Rotary tillers for soil preparation and seedbed pulverization.",
  },
  {
    key: "PLOUGH",
    label: "Plough",
    categorySlug: "plough",
    icon: "🌱",
    tagline: "Disc, mouldboard, and reversible ploughs for primary tillage.",
  },
  {
    key: "POWER_TILLER",
    label: "Power Tiller / Mini Tiller",
    categorySlug: "power-tiller",
    icon: "🚜",
    tagline: "Walk-behind tractors and power tillers for small and wet-paddy fields.",
  },
  {
    key: "HYDRAULIC_TRUCK",
    label: "Hydraulic Truck",
    categorySlug: "hydraulic-truck",
    icon: "🚚",
    tagline: "Heavy-duty hydraulic tipping trucks for bulk farm and crop transport.",
  },
  {
    key: "HARVESTER",
    label: "Harvester",
    categorySlug: "harvester",
    icon: "🌾",
    tagline: "Combine harvesters and grain reapers for fast, efficient harvesting.",
  },
  {
    key: "CULTIVATOR",
    label: "Cultivator",
    categorySlug: "cultivator",
    icon: "⛏️",
    tagline: "Secondary tillage cultivators for aerating soil and weed control.",
  },
  {
    key: "SEED_DRILL",
    label: "Seed Drill / Seed Planter",
    categorySlug: "seeder",
    icon: "🌰",
    tagline: "Seed drills and automatic seed planters for precision sowing.",
  },
  {
    key: "TRAILER",
    label: "Trailer",
    categorySlug: "trailer",
    icon: "🚛",
    tagline: "Hydraulic tipping and non-tipping tractor trolleys for crop transport.",
  },
  {
    key: "OTHER",
    label: "Other Agricultural Machinery",
    categorySlug: "other-machinery",
    icon: "🔧",
    tagline: "Specialized equipment, sprayers, pumps, threshers, and custom implements.",
  },
];

export function getMachineTypeFromCategory(categorySlugOrName?: string | null): MachineTypeKey {
  if (!categorySlugOrName) return "TRACTOR";
  const s = categorySlugOrName.toLowerCase().trim();
  if (s.includes("tractor")) return "TRACTOR";
  if (s.includes("rotavator")) return "ROTAVATOR";
  if (s.includes("plough") || s.includes("plow")) return "PLOUGH";
  if (s.includes("power-tiller") || s.includes("tiller")) return "POWER_TILLER";
  if (s.includes("hydraulic-truck") || s.includes("truck")) return "HYDRAULIC_TRUCK";
  if (s.includes("harvester") || s.includes("combine")) return "HARVESTER";
  if (s.includes("cultivator")) return "CULTIVATOR";
  if (s.includes("seeder") || s.includes("drill") || s.includes("planter")) return "SEED_DRILL";
  if (s.includes("trailer") || s.includes("trolley")) return "TRAILER";
  return "OTHER";
}

export function getCategorySlugForMachineType(type: MachineTypeKey): string {
  const match = MACHINE_TYPES.find((m) => m.key === type);
  return match?.categorySlug || "other-machinery";
}

export interface CustomSpecificationItem {
  name: string;
  value: string;
}

export interface MachinerySpecificationsRecord {
  machineType: MachineTypeKey;
  // Common / general specs
  purchaseYear?: number | null;
  serviceRadiusKm?: number | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  rentalUnitType?: string | null;
  customRentalUnitName?: string | null;

  // 1. Tractor
  hp?: number | null;
  torque?: string | null;
  engineType?: string | null;
  displacementCc?: number | null;
  cylinderCount?: number | null;
  fuelType?: string | null;
  transmissionType?: string | null;
  gearCount?: string | null;
  forwardGears?: number | null;
  reverseGears?: number | null;
  maxSpeedKmh?: number | null;
  ptoType?: string | null;
  ptoRpm?: string | null;
  hydraulicLiftCapacityKg?: number | null;
  hydraulicSystemType?: string | null;
  steeringType?: string | null;
  brakeType?: string | null;
  driveType?: string | null; // 2WD, 4WD
  wheelSize?: string | null;
  tyreSize?: string | null;
  fuelTankCapacityLiters?: number | null;
  weightKg?: number | null;
  groundClearanceMm?: number | null;
  recommendedLandSize?: string | null;
  suitableCrops?: string | null;
  suitableOperations?: string[] | null;
  recommendedImplements?: string | null;

  // 2. Rotavator
  workingWidth?: string | null;
  bladeCount?: number | null;
  bladeType?: string | null; // L-Type, C-Type, J-Type
  bladeSetsCount?: number | null;
  tractorHpRequirement?: string | null;
  gearboxType?: string | null;
  rotorSpeedRpm?: number | null;
  workingDepth?: string | null;
  hitchCategory?: string | null;
  recommendedSoilType?: string | null;
  fieldCapacity?: string | null;

  // 3. Plough
  ploughType?: string | null; // Mouldboard, Disc, Reversible, Chisel, Other
  bottomCount?: number | null;
  discCount?: number | null;
  discDiameter?: string | null;
  hitchType?: string | null;
  bladeMaterial?: string | null;
  recommendedTractorType?: string | null;

  // 4. Power Tiller
  enginePowerHp?: number | null;
  startingSystem?: string | null;
  wheelType?: string | null;
  ptoAvailability?: string | null;
  suitableImplements?: string | null;

  // 5. Hydraulic Truck
  payloadCapacityTons?: number | null;
  hydraulicLiftingCapacityTons?: number | null;
  hydraulicSystem?: string | null;
  bedLengthFeet?: number | null;
  bedWidthFeet?: number | null;
  bedHeightFeet?: number | null;
  bodyType?: string | null;
  tippingType?: string | null;
  axleCount?: number | null;
  suitableMaterials?: string[] | null;
  suitableFarmOperations?: string | null;

  // 6. Harvester
  harvesterType?: string | null;
  cuttingWidthFeet?: number | null;
  headerWidthFeet?: number | null;
  grainTankCapacityLiters?: number | null;
  harvestingCapacity?: string | null;
  workingSpeedKmh?: string | null;
  suitableFieldConditions?: string | null;

  // 7. Cultivator
  tineCount?: number | null;
  tineType?: string | null;

  // 8. Seed Drill
  rowCount?: number | null;
  rowSpacingInches?: number | null;
  seedCapacityKg?: number | null;
  fertilizerCapacityKg?: number | null;
  meteringMechanism?: string | null;
  suitableSeedTypes?: string | null;

  // 9. Trailer
  trailerType?: string | null;
  lengthFeet?: number | null;
  widthFeet?: number | null;
  heightFeet?: number | null;
  tippingHydraulic?: string | null;
  bodyMaterial?: string | null;
  suitableTransport?: string[] | null;

  // 10. Other Machinery
  capacity?: string | null;
  additionalSpecifications?: CustomSpecificationItem[] | null;

  // Allow flexible index access
  [key: string]: unknown;
}

export interface FormattedSpecItem {
  label: string;
  value: string;
  group?: string;
  highlight?: boolean;
}

/**
 * Formats specifications for clean display to Farmers and Owners.
 * Excludes empty, null, or undefined fields.
 */
export function formatMachinerySpecifications(
  specs: MachinerySpecificationsRecord | null | undefined,
  machineType?: MachineTypeKey
): FormattedSpecItem[] {
  if (!specs) return [];
  const type = specs.machineType || machineType || "OTHER";
  const items: FormattedSpecItem[] = [];

  const add = (label: string, val: unknown, unit = "", group = "Technical Specifications", highlight = false) => {
    if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) return;
    const strVal = Array.isArray(val) ? val.join(", ") : `${val}${unit ? ` ${unit}` : ""}`;
    items.push({ label, value: strVal, group, highlight });
  };

  if (type === "TRACTOR") {
    add("Horsepower", specs.hp, "HP", "Engine & Performance", true);
    add("Torque", specs.torque, "", "Engine & Performance");
    add("Engine Type", specs.engineType, "", "Engine & Performance");
    add("Displacement", specs.displacementCc, "cc", "Engine & Performance");
    add("Cylinders", specs.cylinderCount, "", "Engine & Performance");
    add("Fuel Type", specs.fuelType, "", "Engine & Performance");
    add("Fuel Tank", specs.fuelTankCapacityLiters, "L", "Engine & Performance");

    add("Transmission", specs.transmissionType, "", "Transmission & Speed");
    add("Total Gears", specs.gearCount, "", "Transmission & Speed");
    add("Forward Gears", specs.forwardGears, "", "Transmission & Speed");
    add("Reverse Gears", specs.reverseGears, "", "Transmission & Speed");
    add("Max Speed", specs.maxSpeedKmh, "km/h", "Transmission & Speed");

    add("PTO Type", specs.ptoType, "", "PTO & Hydraulics");
    add("PTO RPM", specs.ptoRpm, "", "PTO & Hydraulics");
    add("Hydraulic Lift Capacity", specs.hydraulicLiftCapacityKg, "kg", "PTO & Hydraulics", true);
    add("Hydraulic System", specs.hydraulicSystemType, "", "PTO & Hydraulics");

    add("Drive Type", specs.driveType, "", "Chassis & Dimensions", true);
    add("Steering Type", specs.steeringType, "", "Chassis & Dimensions");
    add("Brake Type", specs.brakeType, "", "Chassis & Dimensions");
    add("Tyre Size", specs.tyreSize, "", "Chassis & Dimensions");
    add("Wheel Size", specs.wheelSize, "", "Chassis & Dimensions");
    add("Total Weight", specs.weightKg, "kg", "Chassis & Dimensions");
    add("Ground Clearance", specs.groundClearanceMm, "mm", "Chassis & Dimensions");

    add("Recommended Land Size", specs.recommendedLandSize, "", "Farmer Recommendation", true);
    add("Suitable Crops", specs.suitableCrops, "", "Farmer Recommendation");
    add("Suitable Operations", specs.suitableOperations, "", "Farmer Recommendation");
    add("Recommended Implements", specs.recommendedImplements, "", "Farmer Recommendation");
  } else if (type === "ROTAVATOR") {
    add("Working Width", specs.workingWidth, "", "Performance & Dimensions", true);
    add("Working Depth", specs.workingDepth, "", "Performance & Dimensions");
    add("Number of Blades", specs.bladeCount, "", "Performance & Dimensions");
    add("Blade Type", specs.bladeType, "", "Performance & Dimensions");
    add("Blade Sets / Flanges", specs.bladeSetsCount, "", "Performance & Dimensions");
    add("Rotor Speed", specs.rotorSpeedRpm, "RPM", "Performance & Dimensions");
    add("Total Weight", specs.weightKg, "kg", "Performance & Dimensions");

    add("Required Tractor HP", specs.tractorHpRequirement, "", "Compatibility", true);
    add("PTO RPM", specs.ptoRpm, "", "Compatibility");
    add("Gearbox Type", specs.gearboxType, "", "Compatibility");
    add("3-Point Hitch Category", specs.hitchCategory, "", "Compatibility");

    add("Recommended Soil Type", specs.recommendedSoilType, "", "Farmer Recommendation", true);
    add("Approx. Field Capacity", specs.fieldCapacity, "", "Farmer Recommendation");
    add("Suitable Crops", specs.suitableCrops, "", "Farmer Recommendation");
    add("Suitable Operations", specs.suitableOperations, "", "Farmer Recommendation");
  } else if (type === "PLOUGH") {
    add("Plough Type", specs.ploughType, "", "Specifications", true);
    add("Number of Bottoms", specs.bottomCount, "", "Specifications");
    add("Number of Discs", specs.discCount, "", "Specifications");
    add("Disc Diameter", specs.discDiameter, "", "Specifications");
    add("Working Width", specs.workingWidth, "", "Specifications");
    add("Working Depth", specs.workingDepth, "", "Specifications");
    add("Total Weight", specs.weightKg, "kg", "Specifications");
    add("Blade / Disc Material", specs.bladeMaterial, "", "Specifications");
    add("Hitch Type", specs.hitchType, "", "Specifications");

    add("Required Tractor HP", specs.tractorHpRequirement, "", "Compatibility", true);
    add("Recommended Tractor Type", specs.recommendedTractorType, "", "Compatibility");
    add("Recommended Soil", specs.recommendedSoilType, "", "Compatibility");
    add("Suitable Crops", specs.suitableCrops, "", "Compatibility");
  } else if (type === "POWER_TILLER") {
    add("Engine Power", specs.enginePowerHp, "HP", "Engine & Drive", true);
    add("Engine Type", specs.engineType, "", "Engine & Drive");
    add("Displacement", specs.displacementCc, "cc", "Engine & Drive");
    add("Fuel Type", specs.fuelType, "", "Engine & Drive");
    add("Fuel Tank", specs.fuelTankCapacityLiters, "L", "Engine & Drive");
    add("Transmission", specs.transmissionType, "", "Engine & Drive");
    add("Gear Count", specs.gearCount, "", "Engine & Drive");
    add("Starting System", specs.startingSystem, "", "Engine & Drive");

    add("Working Width", specs.workingWidth, "", "Dimensions & Features");
    add("Working Depth", specs.workingDepth, "", "Dimensions & Features");
    add("Max Speed", specs.maxSpeedKmh, "km/h", "Dimensions & Features");
    add("Total Weight", specs.weightKg, "kg", "Dimensions & Features");
    add("Wheel Type", specs.wheelType, "", "Dimensions & Features");
    add("PTO Available", specs.ptoAvailability, "", "Dimensions & Features");

    add("Recommended Land Size", specs.recommendedLandSize, "", "Farmer Recommendation", true);
    add("Suitable Implements", specs.suitableImplements, "", "Farmer Recommendation");
    add("Suitable Crops", specs.suitableCrops, "", "Farmer Recommendation");
  } else if (type === "HYDRAULIC_TRUCK") {
    add("Payload Capacity", specs.payloadCapacityTons, "Tons", "Payload & Hydraulics", true);
    add("Lifting Capacity", specs.hydraulicLiftingCapacityTons, "Tons", "Payload & Hydraulics", true);
    add("Hydraulic System", specs.hydraulicSystem, "", "Payload & Hydraulics");
    add("Tipping Type", specs.tippingType, "", "Payload & Hydraulics");
    add("Body Type", specs.bodyType, "", "Payload & Hydraulics");
    add("Bed Dimensions", specs.bedLengthFeet && specs.bedWidthFeet ? `${specs.bedLengthFeet}ft (L) x ${specs.bedWidthFeet}ft (W) x ${specs.bedHeightFeet || 3}ft (H)` : null, "", "Payload & Hydraulics");

    add("Engine Power", specs.enginePowerHp, "HP", "Vehicle Specifications");
    add("Engine Type", specs.engineType, "", "Vehicle Specifications");
    add("Fuel Type", specs.fuelType, "", "Vehicle Specifications");
    add("Transmission", specs.transmissionType || specs.transmission, "", "Vehicle Specifications");
    add("Number of Gears", specs.gearCount, "", "Vehicle Specifications");
    add("Number of Axles", specs.axleCount, "", "Vehicle Specifications");
    add("Max Speed", specs.maxSpeedKmh, "km/h", "Vehicle Specifications");
    add("Ground Clearance", specs.groundClearanceMm, "mm", "Vehicle Specifications");

    add("Suitable Materials", specs.suitableMaterials, "", "Operational Suitability", true);
    add("Farm Operations", specs.suitableFarmOperations, "", "Operational Suitability");
  } else if (type === "HARVESTER") {
    add("Harvester Type", specs.harvesterType, "", "Harvesting Performance", true);
    add("Cutting Width", specs.cuttingWidthFeet, "Feet", "Harvesting Performance", true);
    add("Header Width", specs.headerWidthFeet, "Feet", "Harvesting Performance");
    add("Grain Tank Capacity", specs.grainTankCapacityLiters, "Liters", "Harvesting Performance", true);
    add("Harvesting Capacity", specs.harvestingCapacity, "", "Harvesting Performance", true);
    add("Working Speed", specs.workingSpeedKmh, "", "Harvesting Performance");

    add("Engine Power", specs.enginePowerHp, "HP", "Engine & Machine", true);
    add("Engine Type", specs.engineType, "", "Engine & Machine");
    add("Cylinders", specs.cylinderCount, "", "Engine & Machine");
    add("Fuel Type", specs.fuelType, "", "Engine & Machine");
    add("Fuel Tank", specs.fuelTankCapacityLiters, "L", "Engine & Machine");
    add("Total Weight", specs.weightKg, "kg", "Engine & Machine");

    add("Suitable Crops", specs.suitableCrops, "", "Field Suitability", true);
    add("Field Conditions", specs.suitableFieldConditions, "", "Field Suitability");
  } else if (type === "CULTIVATOR") {
    add("Number of Tines", specs.tineCount, "Tines", "Tillage Specifications", true);
    add("Tine Type", specs.tineType, "", "Tillage Specifications");
    add("Working Width", specs.workingWidth, "", "Tillage Specifications");
    add("Working Depth", specs.workingDepth, "", "Tillage Specifications");
    add("Total Weight", specs.weightKg, "kg", "Tillage Specifications");
    add("Hitch Category", specs.hitchCategory, "", "Tillage Specifications");

    add("Required Tractor HP", specs.tractorHpRequirement, "", "Compatibility & Soil", true);
    add("Suitable Soil", specs.recommendedSoilType, "", "Compatibility & Soil");
    add("Suitable Crops", specs.suitableCrops, "", "Compatibility & Soil");
  } else if (type === "SEED_DRILL") {
    add("Number of Rows", specs.rowCount, "Rows", "Sowing Specifications", true);
    add("Row Spacing", specs.rowSpacingInches, "Inches", "Sowing Specifications");
    add("Working Width", specs.workingWidth, "", "Sowing Specifications");
    add("Seed Box Capacity", specs.seedCapacityKg, "kg", "Sowing Specifications", true);
    add("Fertilizer Box Capacity", specs.fertilizerCapacityKg, "kg", "Sowing Specifications", true);
    add("Metering Mechanism", specs.meteringMechanism, "", "Sowing Specifications");
    add("Working Depth", specs.workingDepth, "", "Sowing Specifications");
    add("Total Weight", specs.weightKg, "kg", "Sowing Specifications");

    add("Required Tractor HP", specs.tractorHpRequirement, "", "Compatibility & Crops", true);
    add("Suitable Crops", specs.suitableCrops, "", "Compatibility & Crops", true);
    add("Suitable Seed Types", specs.suitableSeedTypes, "", "Compatibility & Crops");
  } else if (type === "TRAILER") {
    add("Trailer Type", specs.trailerType, "", "Trailer Specifications", true);
    add("Payload Capacity", specs.payloadCapacityTons, "Tons", "Trailer Specifications", true);
    add("Body Dimensions", specs.lengthFeet && specs.widthFeet ? `${specs.lengthFeet}ft (L) x ${specs.widthFeet}ft (W) x ${specs.heightFeet || 2.5}ft (H)` : null, "", "Trailer Specifications");
    add("Number of Axles", specs.axleCount, "", "Trailer Specifications");
    add("Brake Type", specs.brakeType, "", "Trailer Specifications");
    add("Hitch Type", specs.hitchType, "", "Trailer Specifications");
    add("Hydraulic Tipping", specs.tippingHydraulic, "", "Trailer Specifications", true);
    add("Body Material", specs.bodyMaterial, "", "Trailer Specifications");
    add("Suitable Haulage", specs.suitableTransport, "", "Trailer Specifications", true);
  } else {
    // OTHER
    add("Engine Power", specs.enginePowerHp, "HP", "Equipment Details");
    add("Capacity", specs.capacity, "", "Equipment Details");
    add("Working Width", specs.workingWidth, "", "Equipment Details");
    add("Working Depth", specs.workingDepth, "", "Equipment Details");
    add("Total Weight", specs.weightKg, "kg", "Equipment Details");
    add("Suitable Crops", specs.suitableCrops, "", "Applications");
    add("Suitable Operations", specs.suitableOperations, "", "Applications");
  }

  // Common information
  add("Service Radius", specs.serviceRadiusKm, "km", "Availability & Location");
  add("Available From", specs.availableFrom, "", "Availability & Location");
  add("Available Until", specs.availableUntil, "", "Availability & Location");

  // Additional custom specifications (especially for Other Machinery)
  if (Array.isArray(specs.additionalSpecifications)) {
    for (const item of specs.additionalSpecifications) {
      if (item.name && item.value) {
        add(item.name, item.value, "", "Custom Specifications");
      }
    }
  }

  return items;
}
