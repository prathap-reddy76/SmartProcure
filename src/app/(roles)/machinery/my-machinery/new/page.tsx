import React from "react";
import Link from "next/link";
import { getMachineryCategories } from "@/actions/machinery/machinery-actions";
import { NewMachineryClient } from "./new-machinery-client";

export default async function NewMachineryPage() {
  const categoriesRes = await getMachineryCategories();
  const categories = categoriesRes.success ? categoriesRes.categories : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/machinery/dashboard" className="hover:text-amber-700">
          Machinery Portal
        </Link>
        <span>/</span>
        <Link href="/machinery/my-machinery" className="hover:text-amber-700">
          My Machinery Fleet
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Add New Machine</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          List New Agricultural Machinery
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Provide machine technical specifications, set flexible rental rates, and make your fleet
          discoverable to local farmers.
        </p>
      </div>

      <NewMachineryClient categories={categories} />
    </div>
  );
}
