"use client";

import React from "react";
import {
  DynamicSpecificationsForm,
  CategoryOption,
} from "@/components/machinery/dynamic-specifications-form";

export function NewMachineryClient({ categories }: { categories: CategoryOption[] }) {
  return <DynamicSpecificationsForm categories={categories} isEditMode={false} />;
}
