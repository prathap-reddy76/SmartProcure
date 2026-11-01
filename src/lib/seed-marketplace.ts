import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function seedMarketplace() {
  console.log("=== SEEDING MARKETPLACE CATEGORIES, SHOPS & PRODUCTS ===");

  // 1. Categories
  const categoriesData = [
    {
      name: "Seeds",
      slug: "seeds",
      description: "Certified high-yielding crop seeds, hybrid varieties, and drought-resistant grain seeds.",
      icon: "SeedIcon",
    },
    {
      name: "Fertilizers",
      slug: "fertilizers",
      description: "Organic manures, water-soluble fertilizers, and essential NPK micronutrients.",
      icon: "FertilizerIcon",
    },
    {
      name: "Pesticides",
      slug: "pesticides",
      description: "Safe insecticides, fungicides, and weedicides for healthy crop harvests.",
      icon: "PesticideIcon",
    },
    {
      name: "Crop Protection",
      slug: "crop-protection",
      description: "Organic neem formulations, pheromone traps, and bio-protective shields.",
      icon: "ShieldIcon",
    },
    {
      name: "Agricultural Tools",
      slug: "agricultural-tools",
      description: "Hardened steel hand tools, sickles, spades, and weeding implements.",
      icon: "ToolIcon",
    },
    {
      name: "Farm Equipment",
      slug: "farm-equipment",
      description: "Battery knapsack sprayers, tarpaulins, drip kits, and protective gear.",
      icon: "EquipmentIcon",
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon },
      create: cat,
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✓ Seeded ${categoryMap.size} marketplace categories.`);

  // 2. Shops
  const shopsData = [
    {
      name: "Sri Lakshmi Agro Agencies",
      slug: "sri-lakshmi-agro",
      description: "Authorized dealer of government certified seeds, fertilizers, and modern crop protection.",
      ownerName: "K. Venkatesh",
      phone: "9848012345",
      email: "srilakshmi.agro@example.com",
      address: "Door 4-12, Market Yard Road",
      village: "Nandyal",
      district: "Kurnool",
      state: "Andhra Pradesh",
      pincode: "518501",
    },
    {
      name: "Kisan Seva Krishi Kendra",
      slug: "kisan-seva-kendra",
      description: "Direct farmer service center offering high-grade fertilizers, tools, and spray equipment.",
      ownerName: "Rajeshwar Rao",
      phone: "9415067890",
      email: "kisan.seva@example.com",
      address: "Shop 18, Commercial Complex",
      village: "Tenali",
      district: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522201",
    },
  ];

  const passwordHash = await bcrypt.hash("Password@123", 10);
  const shopMap = new Map<string, string>();
  for (const s of shopsData) {
    const ownerUser = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.ownerName,
        phone: s.phone,
        role: "SHOP_OWNER",
        passwordHash,
      },
      create: {
        name: s.ownerName,
        email: s.email,
        phone: s.phone,
        role: "SHOP_OWNER",
        passwordHash,
      },
    });

    const shopRecord = await prisma.shop.upsert({
      where: { slug: s.slug },
      update: {
        ...s,
        userId: ownerUser.id,
      },
      create: {
        ...s,
        userId: ownerUser.id,
      },
    });
    shopMap.set(s.slug, shopRecord.id);
  }
  console.log(`✓ Seeded ${shopMap.size} agricultural shops with SHOP_OWNER user accounts.`);

  // 3. Products
  const productsData = [
    {
      name: "BPT 5204 (Samba Mahsuri) Paddy Seeds",
      slug: "bpt-5204-paddy-seeds",
      description: "Premium quality Samba Mahsuri certified seeds. Known for excellent cooking quality, medium slender grain, and high market demand. Resistant to common blast in typical conditions.",
      price: 950.0,
      unit: "25 kg bag",
      stock: 45,
      suitableCrops: "Paddy (Rice)",
      variety: "BPT 5204",
      dosage: "20-25 kg per acre for transplantation",
      packageSize: "25 kg",
      season: "Kharif / Rabi",
      categorySlug: "seeds",
      shopSlug: "sri-lakshmi-agro",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "HD-2967 High Yield Wheat Seeds",
      slug: "hd-2967-wheat-seeds",
      description: "High yielding certified wheat seeds suitable for timely sown irrigated conditions. High resistance to yellow and brown rust.",
      price: 820.0,
      unit: "40 kg bag",
      stock: 30,
      suitableCrops: "Wheat",
      variety: "HD-2967",
      dosage: "40 kg per acre",
      packageSize: "40 kg",
      season: "Rabi",
      categorySlug: "seeds",
      shopSlug: "kisan-seva-kendra",
      imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "IFFCO Neem Coated Urea",
      slug: "iffco-neem-coated-urea",
      description: "Government subsidized quality neem coated urea. Retards nitrification of nitrogen and reduces leaching losses, ensuring sustained nitrogen availability for healthy vegetative growth.",
      price: 266.5,
      unit: "45 kg bag",
      stock: 120,
      suitableCrops: "All field crops, cereals, vegetables",
      variety: "46% Nitrogen (Neem Coated)",
      dosage: "Split application based on soil health card",
      packageSize: "45 kg",
      season: "All Seasons",
      categorySlug: "fertilizers",
      shopSlug: "sri-lakshmi-agro",
      imageUrl: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Di-Ammonium Phosphate (DAP 18:46:0)",
      slug: "dap-18-46-fertilizer",
      description: "Standard essential basal fertilizer providing 18% Nitrogen and 46% available Phosphate. Crucial for root development and early seedling vigor.",
      price: 1350.0,
      unit: "50 kg bag",
      stock: 60,
      suitableCrops: "Paddy, Wheat, Sugarcane, Pulses",
      variety: "NPK 18:46:0",
      dosage: "50 kg per acre as basal dose at sowing",
      packageSize: "50 kg",
      season: "Basal Sowing",
      categorySlug: "fertilizers",
      shopSlug: "kisan-seva-kendra",
      imageUrl: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Chlorpyrifos 20% EC Broad Spectrum Insecticide",
      slug: "chlorpyrifos-20-ec-insecticide",
      description: "Proven contact and stomach action insecticide for controlling stem borers, termites, leaf folders, and soil pests in paddy and cotton fields.",
      price: 480.0,
      unit: "1 Litre bottle",
      stock: 25,
      suitableCrops: "Paddy, Cotton, Groundnut",
      variety: "Emulsifiable Concentrate (EC)",
      dosage: "2 to 2.5 ml per litre of water",
      packageSize: "1 Litre",
      season: "Kharif / Rabi",
      categorySlug: "pesticides",
      shopSlug: "sri-lakshmi-agro",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Pure Cold-Pressed Neem Oil (10000 PPM)",
      slug: "pure-neem-oil-crop-protection",
      description: "Organic bio-pesticide and repellent containing 10,000 PPM Azadirachtin. Completely safe for beneficial insects while repelling sucking pests, whiteflies, and aphids.",
      price: 550.0,
      unit: "1 Litre bottle",
      stock: 35,
      suitableCrops: "Vegetables, Pulses, Fruits, Cotton",
      variety: "Organic Certified Extract",
      dosage: "3 to 5 ml per litre of water with mild emulsifier",
      packageSize: "1 Litre",
      season: "All Seasons",
      categorySlug: "crop-protection",
      shopSlug: "sri-lakshmi-agro",
      imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Solar Powered Agricultural Insect Light Trap",
      slug: "solar-insect-light-trap",
      description: "Automatic dusk-to-dawn solar light trap. Lures and traps nocturnal pests, moths, and borers without chemical residue. Protects up to 1.5 acres.",
      price: 2200.0,
      unit: "Piece",
      stock: 0, // Demonstrating Out-of-Stock handling!
      suitableCrops: "Paddy, Vegetables, Cotton, Horticulture",
      variety: "Auto-Timer Solar Model",
      dosage: "1 trap per 1.5 acres",
      packageSize: "Complete Unit with Battery",
      season: "Year-round",
      categorySlug: "crop-protection",
      shopSlug: "kisan-seva-kendra",
      imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Heavy-Duty High Manganese Steel Sickle",
      slug: "manganese-steel-harvest-sickle",
      description: "Precision curved serrated teeth sickle crafted from hardened manganese steel. Ergonomic wooden grip designed for fatigue-free harvesting of paddy and wheat.",
      price: 220.0,
      unit: "Piece",
      stock: 50,
      suitableCrops: "Paddy, Wheat, Fodder crops",
      variety: "Serrated Grade A Steel",
      dosage: "Manual crop harvesting",
      packageSize: "Single tool",
      season: "Harvesting",
      categorySlug: "agricultural-tools",
      shopSlug: "sri-lakshmi-agro",
      imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "16-Litre 12V Battery Operated Knapsack Sprayer",
      slug: "battery-knapsack-sprayer-16l",
      description: "High capacity 16-litre tank equipped with 12V 8Ah rechargeable battery, pressure regulator, and stainless steel telescopic lance. Covers up to 25-30 tanks on a single charge.",
      price: 2450.0,
      unit: "Piece",
      stock: 15,
      suitableCrops: "All agricultural and horticultural crops",
      variety: "Electric Dual-Mode Sprayer",
      dosage: "Liquid fertilizers and pesticides spraying",
      packageSize: "16 Litre Tank + Charger + 4 Nozzles",
      season: "All Seasons",
      categorySlug: "farm-equipment",
      shopSlug: "kisan-seva-kendra",
      imageUrl: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "UV Stabilized Waterproof Crop Tarpaulin (24x18 ft)",
      slug: "waterproof-crop-tarpaulin",
      description: "Multi-layered cross-laminated 250 GSM heavy tarpaulin sheet. 100% waterproof and UV stabilized with reinforced aluminum eyelets every 3 feet. Ideal for grain protection and drying.",
      price: 1850.0,
      unit: "Piece",
      stock: 28,
      suitableCrops: "Harvest grain storage, sun-drying protection",
      variety: "250 GSM Multi-layer",
      dosage: "Post-harvest grain coverage",
      packageSize: "24 ft x 18 ft",
      season: "Post-Harvest / Monsoon",
      categorySlug: "farm-equipment",
      shopSlug: "sri-lakshmi-agro",
      imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
    },
  ];

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.categorySlug)!;
    const shopId = shopMap.get(p.shopSlug)!;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        unit: p.unit,
        stock: p.stock,
        suitableCrops: p.suitableCrops,
        variety: p.variety,
        dosage: p.dosage,
        packageSize: p.packageSize,
        season: p.season,
        categoryId,
        shopId,
        isActive: true,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        unit: p.unit,
        stock: p.stock,
        suitableCrops: p.suitableCrops,
        variety: p.variety,
        dosage: p.dosage,
        packageSize: p.packageSize,
        season: p.season,
        categoryId,
        shopId,
        isActive: true,
      },
    });

    // Seed product image
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: p.imageUrl,
          altText: p.name,
          sortOrder: 0,
        },
      });
    }
  }

  console.log(`✓ Seeded ${productsData.length} marketplace products with images.`);

  // 4. Delivery Partner
  const deliveryEmail = "delivery@smartprocure.com";
  const deliveryUser = await prisma.user.upsert({
    where: { email: deliveryEmail },
    update: {
      name: "Ramesh Delivery Rider",
      phone: "9876543210",
      role: "DELIVERY_PARTNER",
      passwordHash,
    },
    create: {
      name: "Ramesh Delivery Rider",
      email: deliveryEmail,
      phone: "9876543210",
      role: "DELIVERY_PARTNER",
      passwordHash,
    },
  });

  await prisma.deliveryPartner.upsert({
    where: { userId: deliveryUser.id },
    update: {
      phone: "9876543210",
      vehicleType: "Motorcycle",
      vehicleNumber: "AP 21 BK 4589",
      isAvailable: true,
      isActive: true,
    },
    create: {
      userId: deliveryUser.id,
      phone: "9876543210",
      vehicleType: "Motorcycle",
      vehicleNumber: "AP 21 BK 4589",
      isAvailable: true,
      isActive: true,
    },
  });
  console.log(`✓ Seeded Delivery Partner: ${deliveryEmail}`);

  console.log("=== MARKETPLACE SEEDING COMPLETE ===");
}

if (require.main === module) {
  seedMarketplace()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
