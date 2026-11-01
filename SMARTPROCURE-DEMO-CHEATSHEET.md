# SmartProcure — Demo Day Quick Cheat Sheet

> **CRITICAL SECURITY NOTICE:** Passwords and API secrets are never stored in this cheat sheet. Use your pre-configured credentials during the live demonstration.

---

## 1. Demo User Accounts & Roles

| Role | Name | Email (Identifier) | Assigned Scope / Entity |
| :--- | :--- | :--- | :--- |
| **ADMIN** | System Admin | `safe-admin@example.com` | Full Platform Master Data |
| **FARMER** | Prathap Reddy | `prathap@gmail.com` | Demo Farm (Palnadu District) |
| **SHOP_OWNER** | Prathap Reddy | `reddy01@gmail.com` | *Reddy Fertilizers* Storefront |
| **PROCUREMENT_OFFICER** | Ramesh Officer | `officer@smartprocure.com` | *Nuzendla Rythu Bazzar* (`522660`) |
| **DELIVERY_PARTNER** | Ramesh Delivery | `delivery@smartprocure.com` | Palnadu Logistics Cluster |

---

## 2. Core Demo URLs & Navigation

### Authentication & General
- **Login Page:** `http://localhost:3000/login`
- **Notification Drawer:** `http://localhost:3000/notifications`

### Admin Navigation
- **Dashboard:** `http://localhost:3000/admin/dashboard`
- **Shop Directory:** `http://localhost:3000/admin/shops`
- **Procurement Centres:** `http://localhost:3000/admin/procurement-centres`
- **Centre Detail (Nuzendla):** `http://localhost:3000/admin/procurement-centres/cmusojbxq0007uzic98ffhzq9`
- **Procurement MSP Pricing:** `http://localhost:3000/admin/procurement-prices`
- **User Management:** `http://localhost:3000/admin/users`

### Farmer Navigation
- **Farmer Dashboard:** `http://localhost:3000/farmer/dashboard`
- **Agro-Dealer Shops:** `http://localhost:3000/farmer/marketplace/shops`
- **Reddy Fertilizers Storefront:** `http://localhost:3000/farmer/marketplace/shops/reddy-fertilizers-1791048746443`
- **Shopping Cart:** `http://localhost:3000/farmer/cart`
- **Checkout:** `http://localhost:3000/farmer/checkout`
- **Farmer Orders:** `http://localhost:3000/farmer/orders`
- **Procurement Hub:** `http://localhost:3000/farmer/procurement`
- **Find Centres:** `http://localhost:3000/farmer/procurement/centres`
- **My Harvest Bookings:** `http://localhost:3000/farmer/procurement/bookings`

### Shop Owner Navigation
- **Dealer Dashboard:** `http://localhost:3000/shop/dashboard`
- **Incoming Orders:** `http://localhost:3000/shop/orders`
- **Products Catalog:** `http://localhost:3000/shop/products`

### Procurement Officer Navigation
- **Officer Dashboard:** `http://localhost:3000/procurement-officer/dashboard`
- **Today's Queue & Token Calling:** `http://localhost:3000/procurement-officer/queue`
- **Inspections & Weighing:** `http://localhost:3000/procurement-officer/inspections`
- **Settlement & Receipts:** `http://localhost:3000/procurement-officer/payments`

---

## 3. Recommended Presentation Sequence

```text
[Step 1] ADMIN
  └── Verify Master Data: Nuzendla Rythu Bazzar + Paddy MSP (₹23.50/kg)

[Step 2] FARMER (prathap@gmail.com)
  └── Go to /farmer/marketplace/shops -> Open Reddy Fertilizers
  └── Add Urea 46% (₹350) to Cart -> Checkout (COD) -> Order Confirmed

[Step 3] SHOP OWNER (reddy01@gmail.com)
  └── Go to /shop/orders -> View Order -> Set to PROCESSING -> READY_FOR_DELIVERY

[Step 4] FARMER (prathap@gmail.com)
  └── Go to /farmer/procurement/centres -> Select Nuzendla Rythu Bazzar
  └── Book 10 Quintals Paddy for Upcoming Slot -> Token Generated

[Step 5] PROCUREMENT OFFICER (officer@smartprocure.com)
  └── Go to /procurement-officer/queue -> Register Arrival -> Call Next Token
  └── Start Weighing: Gross 1000kg, Tare 50kg -> Net 950kg
  └── Quality: Moisture 12%, Grade A -> Accepted 950kg
  └── Settlement: Auto-calculated ₹22,325.00 -> Process Payment -> Receipt Generated
```

---

## 4. Troubleshooting & Fallback Procedures

| Scenario / Issue | Quick Fallback Action | Root Cause & Resolution |
| :--- | :--- | :--- |
| **Logged into wrong role** | Click Logout in sidebar / header or visit `/login` directly. | NextAuth cookie holds previous role; logging out resets session. |
| **Officer Dashboard shows "Configuration Error"** | Ensure you are logged in as `officer@smartprocure.com`. | The user must be assigned to an active centre (`procurementCentreId`). |
| **Slot shows "Slot Full"** | Pick the next available slot or select tomorrow's date on the dropdown. | Atomic capacity limiter correctly blocked booking when capacity is reached. |
| **Online Payment (UPI) option disabled** | Use **Cash on Delivery (COD)** for the demo. | UPI is intentionally tagged "Coming Soon"; COD is the active demo path. |
| **Cart is empty after checkout** | Navigate directly to `/farmer/orders` to view the placed order. | The cart is atomically cleared upon successful checkout. |
| **Browser Hydration Warning** | Hard refresh (`Ctrl + Shift + R`). | All Dates and Decimals are pre-serialized; hard refresh clears stale cache. |

---

## 5. Key Architecture Points to Highlight

1. **Role Boundary Separation:**
   - Admin manages platform master configuration; does **NOT** approve farmer shop purchases.
   - Shop Owner manages and fulfills **ONLY** their own shop's orders.
   - Procurement Officer operates physical intake at their **assigned** centre only.
2. **Multi-Shop Order Splitting:**
   - Carts with multiple vendor items dynamically split into separate, atomic orders at checkout.
3. **Server-Authoritative Pricing:**
   - Farmers and officers cannot tamper with procurement prices or input product prices; calculations are evaluated server-side directly against database records.
