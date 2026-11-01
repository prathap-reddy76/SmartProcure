# SmartProcure — Live Demo Presentation Script

## 1. Introduction: The Problem & The Solution
**Speaker:**
> "Good morning everyone. Welcome to the demonstration of **SmartProcure** — an end-to-end digital agriculture platform built to streamline the agricultural lifecycle: from farming inputs to guaranteed crop procurement and localized fulfillment.
>
> In today's agricultural economy, farmers face two major bottlenecks:
> 1. **Input exploitation & lack of transparency:** Buying fertilizers, seeds, and agro-chemicals from unverified retailers with fluctuating prices and stock uncertainty.
> 2. **Procurement chaos at harvest time:** Standing in days-long unorganized physical queues at market yards (Rythu Bazzars), suffering middlemen margin deductions, manual weighing disputes, and delayed settlements.
>
> SmartProcure solves this by introducing strict **Role-Separation Architecture**:
> - **Platform Admin** configures master data, prices, and centres — but cannot approve transactions.
> - **Farmers** browse verified dealer storefronts, buy inputs with transparent stock, and book scheduled procurement slots.
> - **Shop Owners** independently manage their inventory and fulfill orders for their shops only.
> - **Procurement Officers** operate the physical centre: registering arrivals, calling queue tokens, recording calibrated weights, conducting quality inspections, and executing instant MSP settlements.
>
> Let's walk through this complete live story."

---

## 2. Admin: Platform & Master Configuration
**Objective:** Show that Admin sets up the platform rules but does not interfere in daily trading operations.

1. **Login:** Log in with the **Admin** account.
2. **Navigate to:** `http://localhost:3000/admin/dashboard`
   - **Show:** Platform overview, total users breakdown by role, active shops, and procurement centres.
3. **Navigate to:** `http://localhost:3000/admin/shops`
   - **Show:** The registered shop directory (e.g., *Reddy Fertilizers*). Explain that Admin can activate or audit shops, but cannot approve farmer purchases on behalf of shopkeepers.
4. **Navigate to:** `http://localhost:3000/admin/procurement-centres`
   - **Click:** *Nuzendla Rythu Bazzar* (Centre Code: `522660`, Palnadu District).
   - **Show:**
     - Assigned operational Procurement Officer.
     - Supported crops: *Paddy* and *Maize*.
     - Upcoming scheduled slot calendar with maximum farmer capacity.
5. **Navigate to:** `http://localhost:3000/admin/procurement-prices`
   - **Show:** Authoritative MSP price configuration (e.g., *Paddy at ₹23.50/kg*, *Maize at ₹22.00/kg*).
   - **Key takeaway:** *"The Admin sets authoritative master prices here. Neither the farmer nor the procurement officer can tamper with these rates on the client."*

---

## 3. Farmer: Shop Discovery & Input Purchase
**Objective:** Show how a farmer discovers a verified local shop and orders agricultural supplies.

1. **Logout Admin** & **Login** as **Farmer** (`prathap@gmail.com`).
2. **Navigate to:** `http://localhost:3000/farmer/dashboard`
   - **Show:** Farmer dashboard with quick links to Farm profile, Orders, Weather, and Procurement.
3. **Navigate to:** `http://localhost:3000/farmer/marketplace/shops`
   - **Show:** Directory of verified agro-dealer shops filtered by district.
   - **Click:** *Reddy Fertilizers* to open the dealer storefront (`/farmer/marketplace/shops/[shopId]`).
4. **Browse Products:**
   - **Show:** Storefront inventory showing live stock, categories, and unit pricing.
   - **Action:** Select *Urea 46% Nitrogen* (or *Paddy seeds*).
   - **Action:** Click **Add to Cart**.
5. **Review Cart & Checkout:**
   - **Navigate to:** `http://localhost:3000/farmer/cart`
   - **Show:** Item line-total, stock validation, and total payable amount.
   - **Click:** **Proceed to Checkout** (`/farmer/checkout`).
   - **Select Payment:** Cash on Delivery (COD Demo Safe).
   - **Click:** **Place Order**.
   - **Show:** Instant confirmation with Order Number (e.g., `ORD-xxxxx`).
   - **Key takeaway:** *"SmartProcure uses Multi-Shop Order Splitting: even if a farmer checks out products from multiple shops, the platform automatically isolates them into distinct, independent shop orders."*

---

## 4. Shop Owner: Order Fulfillment
**Objective:** Show that the Shop Owner sees only their shop's orders and manages fulfillment independently.

1. **Logout Farmer** & **Login** as **Shop Owner** (`reddy01@gmail.com`).
2. **Navigate to:** `http://localhost:3000/shop/dashboard`
   - **Show:** Dealer dashboard with inventory summary and pending orders count.
3. **Navigate to:** `http://localhost:3000/shop/orders`
   - **Show:** The farmer's newly placed order appears with status `CONFIRMED`.
   - **Action:** Open the order and update status to `PROCESSING`, then `READY_FOR_DELIVERY`.
   - **Key takeaway:** *"Notice that this Shop Owner sees only orders for Reddy Fertilizers. Shop Owners cannot view or tamper with orders from other competing shops."*

---

## 5. Farmer: Harvest Procurement Booking
**Objective:** Demonstrate slot booking for harvest sale at government procurement prices.

1. **Logout Shop Owner** & **Login** back as **Farmer** (`prathap@gmail.com`).
2. **Navigate to:** `http://localhost:3000/farmer/orders`
   - **Show:** The previous input order now reflects the updated `READY_FOR_DELIVERY` status in real-time.
3. **Navigate to:** `http://localhost:3000/farmer/procurement`
   - **Click:** **Find Procurement Centre** (`/farmer/procurement/centres`).
   - **Select Centre:** *Nuzendla Rythu Bazzar*.
   - **Show:** Centre details, operating hours, accepted crops (*Paddy*, *Maize*), and slot calendar.
4. **Book Slot:**
   - Select Crop: *Paddy*.
   - Expected Quantity: *10 Quintals* (1,000 kg).
   - Date: Select an upcoming slot date.
   - Select Time Slot: (e.g., *09:00 AM – 01:00 PM*).
   - **Click:** **Confirm Booking**.
   - **Show:** Booking Success screen showing:
     - **Unique Booking Number:** `BKG-xxxxxx`
     - **Queue Token:** `#60-xxxx`
     - Scheduled date, time window, and centre location.

---

## 6. Procurement Officer: Arrival, Queue, Weighing, Quality & Settlement
**Objective:** Show the high-tech operational handling by the assigned on-site procurement officer.

1. **Logout Farmer** & **Login** as **Procurement Officer** (`officer@smartprocure.com`).
2. **Navigate to:** `http://localhost:3000/procurement-officer/dashboard`
   - **Show:** Scoped dashboard strictly locked to *Nuzendla Rythu Bazzar*.
   - **Show:** KPI metrics: Today's Bookings, Arrived, Waiting, In Progress, Weighing, Quality, Accepted.
3. **Navigate to:** `http://localhost:3000/procurement-officer/queue`
   - **Action:** Locate the farmer's booking by Token or Booking Number.
   - **Click:** **Register Arrival** (transitions status from `BOOKED` to `WAITING`).
   - **Action:** Click **Call Next Token** to summon the farmer to the inspection bay (status becomes `IN_PROGRESS`).
4. **Weighing Phase:**
   - **Click:** Open Booking Detail (`/procurement-officer/bookings/[bookingId]`).
   - **Action:** Click **Start Weighing**.
   - Input Gross Weight: `1000 kg` (Loaded vehicle/bags).
   - Input Tare Weight: `50 kg` (Empty bags/vehicle).
   - **Click:** **Submit Weights** &rarr; System records calibrated **Net Weight = 950 kg**.
5. **Quality Inspection Phase:**
   - **Action:** Click **Start Quality Inspection**.
   - Moisture Content: `12%` (Safe threshold).
   - Grade: `Grade A`.
   - Accepted Quantity: `950 kg`, Rejected: `0 kg`.
   - **Click:** **Complete Inspection** &rarr; Status becomes `ACCEPTED`.
6. **Instant MSP Settlement & Payment:**
   - **Action:** Click **Generate Settlement**.
   - **Highlight:** The platform automatically computes `950 kg × ₹23.50/kg = ₹22,325.00` using the Admin's authoritative database price.
   - **Click:** **Process Payment** (Demo Bank Transfer / Cash).
   - **Show:** Official Receipt generated with unique Reference Number `SP-PROC-xxxxx`.

---

## 7. Real-Time Notifications
**Objective:** Highlight the real-time event system.

1. **Open Notification Bell:** Click the bell icon in the top header.
2. **Show:** Unread notifications tracking each milestone:
   - *"Procurement Slot Booked — Token #60-xxxx"*
   - *"Arrival Registered at Nuzendla Rythu Bazzar"*
   - *"Weighing Completed: 950 KG"*
   - *"Quality Inspection Passed: Grade A"*
   - *"Procurement Settlement Processed: ₹22,325.00"*
3. **Highlight:** Deterministic `eventKey` idempotency prevents duplicate notifications on page refreshes or SSE reconnects.

---

## 8. Closing & Business Impact
**Speaker:**
> "To conclude, SmartProcure bridges the gap between fragmented agricultural commerce and government-mandated procurement:
> - **Total Transparency:** Every price is server-authoritative and traceable.
> - **Zero Middleman Leakage:** Direct farmer-to-dealer commerce and direct farmer-to-officer harvest settlement.
> - **Operational Discipline:** Live queue management, atomic slot booking preventing yard overcrowding, and automated quality-linked payouts.
> - **Enterprise Architecture:** Built on Next.js 16, TypeScript, Prisma ORM, and PostgreSQL with zero schema compromises.
>
> Thank you! We are now open for questions."
