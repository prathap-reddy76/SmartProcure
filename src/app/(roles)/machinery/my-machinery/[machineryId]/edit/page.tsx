import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import {
  getMachineryListingById,
  getMachineryCategories,
} from "@/actions/machinery/machinery-actions";
import { DynamicSpecificationsForm } from "@/components/machinery/dynamic-specifications-form";

export const metadata = {
  title: "Edit Machinery Listing | SmartProcure",
  description: "Update machinery specifications, rental rates, and gallery.",
};

export default async function EditMachineryPage({
  params,
}: {
  params: Promise<{ machineryId: string }>;
}) {
  const session = await requireAnyRole(["MACHINERY_OWNER", "ADMIN"]);
  const user = session?.user as SessionUser;
  if (!user?.id) {
    redirect("/login");
  }

  const { machineryId } = await params;

  const [machineRes, categoriesRes] = await Promise.all([
    getMachineryListingById(machineryId),
    getMachineryCategories(),
  ]);

  if (!machineRes.success || !machineRes.machinery) {
    notFound();
  }

  const machine = machineRes.machinery;

  // Authorization check (IDOR protection)
  if (machine.ownerId !== user.id && user.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
        <h2 className="text-lg font-bold text-red-800">Access Denied</h2>
        <p className="text-sm text-red-600">
          You are not authorized to edit this machinery listing. You can only modify machinery you own.
        </p>
        <Link
          href="/machinery/my-machinery"
          className="inline-block px-4 py-2 bg-red-700 text-white font-bold text-xs rounded-xl"
        >
          &larr; Back to My Machinery Fleet
        </Link>
      </div>
    );
  }

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
        <span className="text-gray-900 font-medium">Edit {machine.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Equipment Specifications
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Update technical details, rates, and operational specifications for {machine.name}.
          </p>
        </div>

        <Link
          href={`/farmer/machinery/${machine.id}`}
          target="_blank"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 shrink-0"
        >
          <span>👁️ Preview Farmer Listing</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <DynamicSpecificationsForm
        categories={categories}
        initialData={machine as unknown as Parameters<typeof DynamicSpecificationsForm>[0]["initialData"]}
        isEditMode={true}
      />
    </div>
  );
}
