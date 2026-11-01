import { prisma } from "@/lib/prisma";

export const DEFAULT_MACHINERY_CATEGORIES = [
  {
    name: "Tractor",
    slug: "tractor",
    description: "Multi-purpose agricultural tractors for ploughing, tilling, and haulage.",
    icon: "🚜",
  },
  {
    name: "Harvester & Combine",
    slug: "harvester",
    description: "Combine harvesters and grain reapers for fast, efficient harvesting.",
    icon: "🌾",
  },
  {
    name: "Rotavator",
    slug: "rotavator",
    description: "Rotary tillers for soil preparation and seedbed pulverization.",
    icon: "⚙️",
  },
  {
    name: "Cultivator",
    slug: "cultivator",
    description: "Secondary tillage cultivators for aerating soil and weed control.",
    icon: "⛏️",
  },
  {
    name: "Plough",
    slug: "plough",
    description: "Disc, mouldboard, and reversible ploughs for primary tillage.",
    icon: "🌱",
  },
  {
    name: "Seed Drill / Seed Planter",
    slug: "seeder",
    description: "Seed drills and automatic seed planters for precision sowing.",
    icon: "🌰",
  },
  {
    name: "Sprayer",
    slug: "sprayer",
    description: "Tractor-mounted boom sprayers and power sprayers for crop protection.",
    icon: "🚿",
  },
  {
    name: "Power Tiller / Mini Tiller",
    slug: "power-tiller",
    description: "Walk-behind tractors and power tillers for small and wet-paddy fields.",
    icon: "🚜",
  },
  {
    name: "Hydraulic Truck",
    slug: "hydraulic-truck",
    description: "Heavy-duty hydraulic tipping trucks for bulk farm and crop transport.",
    icon: "🚚",
  },
  {
    name: "Trailer & Trolley",
    slug: "trailer",
    description: "Hydraulic tipping and non-tipping tractor trolleys for crop transport.",
    icon: "🚛",
  },
  {
    name: "Thresher",
    slug: "thresher",
    description: "Multi-crop threshers for separating grain from stalks and husks.",
    icon: "🌾",
  },
  {
    name: "Water Pump",
    slug: "water-pump",
    description: "Diesel and electric water pumps for agricultural irrigation.",
    icon: "💧",
  },
  {
    name: "Other Agricultural Machinery",
    slug: "other-machinery",
    description: "Specialized farming equipment, post-harvest machinery, and custom implements.",
    icon: "🔧",
  },
];

/**
 * Ensures default agricultural machinery categories exist in database.
 */
export async function ensureDefaultMachineryCategories() {
  for (const cat of DEFAULT_MACHINERY_CATEGORIES) {
    await prisma.machineryCategory.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        isActive: true,
      },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
      },
    });
  }
}
