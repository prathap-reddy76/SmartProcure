import React from "react";
import { requireRole } from "@/lib/auth-utils";
import {
  getFarmerMachineryListings,
  getMachineryCategories,
} from "@/actions/machinery/machinery-actions";
import { MachineryMarketplaceClient } from "./marketplace-client";

export const metadata = {
  title: "Machinery Marketplace & Rental | SmartProcure",
  description: "Find and rent tractors, harvesters, and farm equipment from local owners.",
};

export default async function FarmerMachineryPage() {
  await requireRole("FARMER");

  const [categoriesRes, listingsRes] = await Promise.all([
    getMachineryCategories(),
    getFarmerMachineryListings({ availableOnly: true }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8">
      <MachineryMarketplaceClient
        categories={categoriesRes.categories || []}
        initialListings={listingsRes.listings || []}
      />
    </div>
  );
}
