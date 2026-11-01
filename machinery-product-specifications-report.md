# SmartProcure — Machinery Shop Advanced Product Listing Report

## 1. Implementation Overview

We upgraded the **Machinery Shop / Machinery Owner product-listing system** into a dynamic, specification-driven platform tailored for agricultural machinery. Rather than presenting a generic, one-size-fits-all form, the system now:
1. Places **Machine Type Selection** as the primary first choice on the creation/edit form.
2. Dynamically displays technical and operational fields relevant to the selected machine type.
3. Provides a multiple-image upload interface supporting drag-and-drop, thumbnail previews, primary cover selection, and strict MIME/extension validation.
4. Enhances the Farmer discovery and machinery detail experience with grouped, high-signal technical specifications, intuitive badges, and advanced multi-parameter search filters.
5. Preserves the existing booking and owner approval workflows without introducing regressions or breaking changes.

---

## 2. Supported Machine Types

The system supports all 10 agricultural machinery types:

1. **Tractor** (`tractor` / `TRACTOR`): Multi-purpose tractors for ploughing, tilling, haulage, and implement PTO drive.
2. **Rotavator** (`rotavator` / `ROTAVATOR`): Rotary tillers for seedbed preparation, stubble incorporation, and wetland puddling.
3. **Plough** (`plough` / `PLOUGH`): Primary tillage equipment including MB ploughs, disc ploughs, and reversible hydraulic ploughs.
4. **Power Tiller / Mini Tiller** (`power-tiller` / `POWER_TILLER`): Walk-behind tractors and mini tillers for smallholdings, wetland paddy, and interculture.
5. **Hydraulic Truck** (`hydraulic-truck` / `HYDRAULIC_TRUCK`): Heavy-duty hydraulic tipping trucks for bulk farm produce, sugarcane, and fertilizer haulage.
6. **Harvester** (`harvester` / `HARVESTER`): Self-propelled combines, track-type paddy harvesters, and grain reapers.
7. **Cultivator** (`cultivator` / `CULTIVATOR`): Secondary tillage implements with rigid, spring-loaded, or duckfoot tines.
8. **Seed Drill / Seed Planter** (`seeder` / `SEED_DRILL`): Multi-row automatic seed and fertilizer drills for precision sowing.
9. **Trailer** (`trailer` / `TRAILER`): Hydraulic tipping and non-tipping tractor trolleys for bulk cargo.
10. **Other Agricultural Machinery** (`other-machinery` / `OTHER`): Boom sprayers, threshers, water pumps, and custom farm equipment with dynamic key-value specification tables.

---

## 3. Specifications Implemented Per Machine Type

### Common Information (All Machines)
- **Basic Identification**: Machine Name, Brand / Manufacturer, Model Variant, Manufacturing Year, Purchase Year, Overall Condition (`NEW`, `EXCELLENT`, `GOOD`, `FAIR`), Equipment Description.
- **Rental Pricing & Modes**: Hourly Rate (`pricePerHour`), Daily Rate (`pricePerDay`), Per Acre Rate (`pricePerAcre`), Custom Rate (`customRentalPrice` with unit name like "Per Trip" / "Per Ton"), Refundable Security Deposit, Delivery Charge.
- **Availability & Range**: Availability Status (`isAvailable`), Available From Date, Available Until Date, Base Location (City / Mandal), Physical Shed Address, Service Radius (km).

### 1. Tractor Specifications
- **Engine & Performance**: Horsepower (HP), Torque (Nm @ RPM), Engine Displacement (cc), Number of Cylinders, Engine Type, Fuel Type, Fuel Tank Capacity (Liters).
- **Transmission & Speed**: Transmission Type, Gearbox Configuration (Total, Forward, Reverse), Max Speed (km/h).
- **PTO & Hydraulics**: PTO Type (Dual/Single/Independent/Reverse), PTO RPM (540/1000), Hydraulic Lifting Capacity (kg), Hydraulic System Type (ADDC, Position/Draft Control).
- **Chassis & Dimensions**: Drive Type (2WD / 4WD), Steering Type (Hydrostatic Power / Mechanical), Brake Type (Oil Immersed / Dry Disc), Front/Rear Tyre Size, Wheel Size, Total Weight (kg), Ground Clearance (mm).
- **Farmer Recommendations**: Recommended Land Size (acres), Suitable Crops, Suitable Operations (Ploughing, Rotavating, Sowing, Haulage), Recommended Implement Packages.

### 2. Rotavator Specifications
- Working Width (feet/meters), Number of Blades, Blade Type (L-Type, C-Type, J-Type), Number of Flanges / Blade Sets, Tractor HP Requirement, PTO RPM, Gearbox Type (Single / Multi Speed), Rotor Speed (RPM), Working Depth (inches), Total Weight (kg), Three-Point Hitch Category (Cat I/II), Recommended Soil Type, Field Capacity (acres/hr), Suitable Crops.

### 3. Plough Specifications
- Plough Type (Mouldboard, Disc, Reversible, Chisel, Other), Number of Bottoms / Furrows, Number of Discs, Disc Diameter (inches/mm), Working Width, Working Depth, Tractor HP Requirement, Total Weight (kg), Hitch Type (3-Point Linkage Cat II / Trailed), Blade/Disc Material (Boron Steel), Recommended Soil, Suitable Crops.

### 4. Power Tiller / Mini Tiller
- Engine Power (HP), Engine Type, Displacement (cc), Fuel Type, Number of Cylinders, Transmission Type, Number of Gears, Working Width, Working Depth, Max Speed (km/h), Fuel Tank Capacity (L), Weight (kg), PTO Availability, Wheel Type (Cage Wheels / Rubber Tyres), Starting System (Electric Start / Hand Recoil), Suitable Implements, Suitable Crops, Recommended Land Size.

### 5. Hydraulic Truck
- Payload Capacity (Tons), Hydraulic Lifting Capacity (Tons), Hydraulic System (Underbody Telescopic Ram / Twin Ram), Tipping Type (Rear Tipping / 3-Way Tipping), Bed Dimensions (Length, Width, Height in feet), Body Type (High Side, Drop Side, Flatbed), Axle Count, Ground Clearance (mm), Engine Power (HP), Fuel Type, Transmission, Max Speed, Suitable Materials (Paddy, Fertilizer, Cane, Soil), Farm Operations.

### 6. Harvester
- Harvester Type (Self-Propelled Combine, Track-Type Wet Paddy, Tractor-Mounted), Engine Power (HP), Engine Type, Fuel Type, Cutting Width (feet), Header Width (feet), Grain Tank Capacity (Liters), Harvesting Capacity (acres/hr), Working Speed (km/h), Fuel Tank Capacity, Number of Cylinders, Weight (kg), Suitable Crops, Suitable Field Conditions.

### 7. Cultivator
- Number of Tines (9, 11, 13), Tine Type (Spring Loaded, Rigid, Duckfoot), Working Width (feet), Working Depth (inches), Tractor HP Requirement, Total Weight (kg), Hitch Category, Suitable Soil, Suitable Crops.

### 8. Seed Drill / Seed Planter
- Number of Rows (9, 11), Row Spacing (inches), Working Width (feet), Seed Box Capacity (kg), Fertilizer Box Capacity (kg), Seed Metering Mechanism (Fluted Roller, Cup Feed, Vacuum), Working Depth (inches), Tractor HP Requirement, Total Weight (kg), Suitable Crops, Suitable Seed Types.

### 9. Trailer
- Trailer Type (2-Wheel Hydraulic Tipper, 4-Wheel Tipper, Non-Tipping Trolley, Tandem Axle), Payload Capacity (Tons), Bed Length, Width, Height (feet), Number of Axles, Brake Type, Hitch Type, Hydraulic Tipping Availability, Body Material (High Strength Corrugated Steel), Suitable Cargo (Grain Bags, Sugarcane, Fodder, Manure, Gravel).

### 10. Other Agricultural Machinery
- Engine Power (HP), Machine Weight (kg), Working Width, Working Depth, Output Capacity, Suitable Crops, Suitable Operations, Equipment Description.
- **Dynamic Custom Specifications Table**: Machinery owners can add and remove custom key-value rows (`Specification Name` and `Value`, e.g., "Boom Width: 12 meters", "Water Tank: 5000 Litres") without arbitrary HTML or code injection risk.

---

## 4. Image Upload & Gallery Experience

- **Component**: [`MachineryImageUploader`](file:///d:/smartprocure/src/components/machinery/machinery-image-uploader.tsx)
- **Supported Formats**: JPEG (`image/jpeg`), PNG (`image/png`), WebP (`image/webp`).
- **Security Rejection**: Strictly rejects SVG, HTML, JavaScript, and executables (`.svg`, `.html`, `.htm`, `.js`, `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.msi`, `.py`).
- **File Limits**: Maximum 8 images per machinery listing; maximum 10MB per file.
- **Storage Backend**: Built atop SmartProcure's existing [`storage`](file:///d:/smartprocure/src/lib/storage/index.ts) abstraction (`LocalStorageProvider` writing to `/uploads/` with sanitized filenames).
- **Gallery Controls**:
  - Live upload preview with spinner feedback.
  - Automatic designation of the first image (`sortOrder: 0`) as the **Main Cover Photo**.
  - "Set as Main" button allowing instant re-ordering of cover photos.
  - "Remove" action per image.
  - Responsive mobile grid (1-2 columns on phones, 3-4 columns on desktop).

---

## 5. Farmer Experience & Discovery

- **Marketplace Discovery** ([`MachineryMarketplaceClient`](file:///d:/smartprocure/src/app/(roles)/farmer/machinery/marketplace-client.tsx)):
  - Category / Machine Type chips with icons.
  - Multi-parameter search across machine name, brand, model, description, and location.
  - Advanced filter drawer: Equipment Condition (`NEW`, `EXCELLENT`, `GOOD`, `FAIR`), Min Engine Power (HP), Max Daily Budget (₹), and Rental Mode (Daily, Hourly, Per Acre).
  - Geolocation detection: "Near Me" GPS distance calculation and nearest-first sorting.
  - Machine cards showcase machine type badges, key specification pills (HP, drive type, working width, payload capacity), and pricing breakdown.
- **Machinery Details Page** ([`MachineryDetailsPage`](file:///d:/smartprocure/src/app/(roles)/farmer/machinery/[machineryId]/page.tsx)):
  - Cover photo and thumbnail strip gallery.
  - Formatted, grouped technical specifications (Engine & Performance, Transmission, PTO & Hydraulics, Chassis & Dimensions, Farmer Recommendations).
  - Clean omission of empty or inapplicable fields.
  - Interactive Google Maps navigation link.
  - Sticky rental package selection and direct link to `/farmer/machinery/[machineryId]/book`.

---

## 6. Booking Workflow Preservation

The existing booking flow is fully preserved:
```text
Farmer
  ↓
Discovers Machinery via Marketplace
  ↓
Views Detailed Specifications
  ↓
Proceeds to Book (/farmer/machinery/[machineryId]/book)
  ↓
Booking Created in PENDING status
  ↓
Machinery Owner Reviews Booking (/machinery/bookings)
  ↓
Owner Approves (CONFIRMED) or Rejects (CANCELLED)
```
- Admin does **NOT** approve machinery bookings (approval authority remains exclusively with the Machinery Owner).
- Zero schema breaking changes to `MachineryBooking`.

---

## 7. Security & Authorization

- **Server-Side User Scoping**: All mutations (`createMachineryListing`, `updateMachineryListing`, `deleteMachineryListing`, `uploadMachineryImage`) derive the user ID strictly from `auth()` / `requireAnyRole(["MACHINERY_OWNER", "ADMIN"])`.
- **IDOR Protection**: Verified on both edit pages and server actions. Attempting to edit another owner's machine throws `"Forbidden: You do not own this machine"`.
- **Farmer Isolation**: Farmers can only browse listings and create rental bookings; they cannot create, edit, or delete machinery fleet records.

---

## 8. Database Schema Changes

No existing columns or tables were dropped or modified.
- Added one nullable column `specifications Json?` to `model Machinery` in `prisma/schema.prisma`.
- Executed non-destructively:
  ```sql
  ALTER TABLE "Machinery" ADD COLUMN IF NOT EXISTS "specifications" JSONB;
  ```
- Categories seeded cleanly via `ensureDefaultMachineryCategories()` to include `Hydraulic Truck` (`hydraulic-truck`) and `Other Agricultural Machinery` (`other-machinery`).

---

## 9. Testing & Verification

An automated verification test script ([`test-machinery-specifications.js`](file:///d:/smartprocure/scratch/test-machinery-specifications.js)) was executed against the database:

| # | Test Scenario | Result |
|---|---------------|--------|
| 1 | Create Tractor with 24 technical specs | **PASS** |
| 2 | Create Rotavator with working width, blade type, HP req | **PASS** |
| 3 | Create Plough with reversible type, bottoms, working depth | **PASS** |
| 4 | Create Power Tiller with starting system, gear drive | **PASS** |
| 5 | Create Hydraulic Truck with tipping type, payload capacity | **PASS** |
| 6 | Create Harvester with cutting width, grain tank capacity | **PASS** |
| 7 | Create Cultivator with tine count, tine type | **PASS** |
| 8 | Create Seed Drill with row count, metering mechanism | **PASS** |
| 9 | Create Trailer with payload capacity, tipping hydraulic | **PASS** |
| 10 | Create Other Machinery with dynamic key-value specifications | **PASS** |
| 11 | Retrieve specifications JSON and verify field integrity | **PASS** |
| 12 | Verify IDOR protection: Owner A cannot edit Owner B's machinery | **PASS** |
| 13 | Verify Farmer booking creation on newly specified tractor | **PASS** |
| 14 | Verify Machinery Owner confirms booking | **PASS** |
| 15 | Verify Image Upload validation: JPG/PNG/WebP pass; SVG/HTML/EXE reject; max 8 limit | **PASS** |

---

## 10. Build Validation

- `npx prisma validate`: **PASS (Valid schema 🚀)**
- `npx prisma generate`: **PASS (Generated in 415ms)**
- `npx tsc --noEmit`: **PASS (0 errors)**
- `npx eslint (all machinery files)`: **PASS (0 errors, 0 warnings)**
- `npm run build`: **PASS (All 70 static & dynamic routes compiled successfully)**

---

## 11. Known Limitations & Notes

- **Map Coordinates**: Machinery listings support optional GPS coordinates (`latitude`, `longitude`). If coordinates are omitted, the Google Maps link falls back to city/mandal search query.
- **Image Processing**: Image upload currently stores files directly in `public/uploads` using the local storage provider. In cloud production deployments, setting `STORAGE_PROVIDER=s3` will seamlessly delegate uploads to S3/R2 through the existing `storage` interface.

---

## Final Status
**COMPLETE & READY FOR USE**
