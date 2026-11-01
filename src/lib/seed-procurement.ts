import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function seedProcurement() {
  console.log("=== SEEDING PROCUREMENT CENTRES & CROPS ===");

  // 1. Seed Procurement Officer
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const officerEmail = "officer@smartprocure.com";
  
  const officerUser = await prisma.user.upsert({
    where: { email: officerEmail },
    update: {
      name: "Ramesh Procurement Officer",
      phone: "9876543333",
      role: "PROCUREMENT_OFFICER",
      passwordHash,
    },
    create: {
      name: "Ramesh Procurement Officer",
      email: officerEmail,
      phone: "9876543333",
      role: "PROCUREMENT_OFFICER",
      passwordHash,
    },
  });

  // 2. Seed Master Crops for Procurement
  const cropsData = [
    { name: "Paddy", nameTe: "వరి", description: "Standard paddy procurement" },
    { name: "Maize", nameTe: "మొక్కజొన్న", description: "Maize/Corn procurement" },
    { name: "Cotton", nameTe: "పత్తి", description: "Cotton procurement" },
    { name: "Red Gram", nameTe: "కంది", description: "Red gram / Pigeon pea" },
  ];

  const cropMap = new Map<string, string>();
  for (const c of cropsData) {
    const crop = await prisma.crop.upsert({
      where: { name: c.name },
      update: { nameTe: c.nameTe, description: c.description },
      create: c,
    });
    cropMap.set(c.name, crop.id);
  }

  // 3. Seed Procurement Centres
  const centresData = [
    {
      name: "Sri Lakshmi Procurement Centre",
      code: "PC-KRN-001",
      description: "Primary procurement centre for Kurnool district farmers.",
      address: "APMC Market Yard",
      village: "Kallur",
      mandal: "Kurnool",
      district: "Kurnool",
      state: "Andhra Pradesh",
      pincode: "518003",
      contactPhone: "08518-223344",
      operatingStartTime: "09:00",
      operatingEndTime: "17:00",
    },
    {
      name: "Vizag Farmers Procurement Centre",
      code: "PC-VZG-002",
      description: "Coastal procurement centre.",
      address: "Gajuwaka Main Road",
      village: "Gajuwaka",
      mandal: "Gajuwaka",
      district: "Visakhapatnam",
      state: "Andhra Pradesh",
      pincode: "530026",
      contactPhone: "0891-234567",
      operatingStartTime: "08:00",
      operatingEndTime: "16:00",
    },
    {
      name: "Anakapalle Agriculture Procurement Centre",
      code: "PC-AKP-003",
      description: "Anakapalle jaggery and crop procurement hub.",
      address: "Anakapalle Market",
      village: "Anakapalle",
      mandal: "Anakapalle",
      district: "Visakhapatnam",
      state: "Andhra Pradesh",
      pincode: "531001",
      contactPhone: "08922-223344",
      operatingStartTime: "09:00",
      operatingEndTime: "18:00",
    }
  ];

  const centreMap = new Map<string, string>();
  for (const c of centresData) {
    const centre = await prisma.procurementCentre.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
    centreMap.set(c.code, centre.id);
  }

  // Assign Sri Lakshmi centre to the test officer
  await prisma.user.update({
    where: { id: officerUser.id },
    data: { procurementCentreId: centreMap.get("PC-KRN-001") },
  });

  // 4. Link Crops to Centres (ProcurementCentreCrop)
  // Let's link Paddy and Maize to Sri Lakshmi
  const pcKrnId = centreMap.get("PC-KRN-001")!;
  const paddyId = cropMap.get("Paddy")!;
  const maizeId = cropMap.get("Maize")!;
  const cottonId = cropMap.get("Cotton")!;

  const configs = [
    { centreId: pcKrnId, cropId: paddyId, dailyCapacity: 1000, minimumQuantity: 5, maximumQuantity: 100 },
    { centreId: pcKrnId, cropId: maizeId, dailyCapacity: 500, minimumQuantity: 5, maximumQuantity: 80 },
    { centreId: centreMap.get("PC-VZG-002")!, cropId: paddyId, dailyCapacity: 1200, minimumQuantity: 10, maximumQuantity: 150 },
    { centreId: centreMap.get("PC-AKP-003")!, cropId: cottonId, dailyCapacity: 800, minimumQuantity: 5, maximumQuantity: 100 },
  ];

  for (const conf of configs) {
    await prisma.procurementCentreCrop.upsert({
      where: { centreId_cropId: { centreId: conf.centreId, cropId: conf.cropId } },
      update: conf,
      create: conf,
    });
  }

  // 5. Seed Slots for Sri Lakshmi (Next 7 days)
  console.log("Generating slots for Sri Lakshmi PC...");
  const timeRanges = [
    { start: "09:00", end: "11:00", capacity: 20 },
    { start: "11:00", end: "13:00", capacity: 20 },
    { start: "14:00", end: "16:00", capacity: 20 },
  ];

  for (let i = 0; i < 7; i++) {
    const slotDate = new Date();
    slotDate.setDate(slotDate.getDate() + i);
    slotDate.setHours(0, 0, 0, 0);

    for (const tr of timeRanges) {
      await prisma.procurementSlot.upsert({
        where: {
          centreId_date_startTime: {
            centreId: pcKrnId,
            date: slotDate,
            startTime: tr.start,
          }
        },
        update: { capacity: tr.capacity, endTime: tr.end },
        create: {
          centreId: pcKrnId,
          date: slotDate,
          startTime: tr.start,
          endTime: tr.end,
          capacity: tr.capacity,
        },
      });
    }
  }

  console.log("=== PROCUREMENT SEEDING COMPLETE ===");
}

if (require.main === module) {
  seedProcurement()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
