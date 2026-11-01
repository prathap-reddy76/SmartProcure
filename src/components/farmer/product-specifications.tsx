import React from "react";

interface ProductSpecificationsProps {
  productType: string;
  specifications: any;
  suitableCrops?: string | null;
  dosage?: string | null;
  packageSize?: string | null;
}

export function ProductSpecifications({ 
  productType, 
  specifications,
  suitableCrops,
  dosage,
  packageSize 
}: ProductSpecificationsProps) {
  const spec = specifications || {};

  const isEmpty = (val: any) => val === undefined || val === null || val === "";

  const renderSection = (title: string, fields: { label: string, value: any }[]) => {
    const validFields = fields.filter(f => !isEmpty(f.value));
    if (validFields.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
          {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {validFields.map((f, i) => (
            <div key={i}>
              <span className="text-xs font-semibold text-gray-500 block mb-0.5">{f.label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {typeof f.value === 'boolean' ? (f.value ? 'Yes' : 'No') : String(f.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (productType === "FERTILIZER") {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
        {renderSection("Product Information", [
          { label: "Product Type", value: spec.productTypeInput },
          { label: "Composition", value: spec.composition },
          { label: "Active Ingredient", value: spec.activeIngredient },
          { label: "NPK Ratio", value: spec.npkRatio },
          { label: "Package Size", value: packageSize || spec.packageSize },
        ])}
        {renderSection("Crop & Application", [
          { label: "Suitable Crops", value: suitableCrops || spec.cropSuitability },
          { label: "Application Method", value: spec.applicationMethod },
          { label: "Dosage & Usage Instructions", value: dosage || spec.dosage },
        ])}
      </div>
    );
  }

  if (productType === "MACHINERY_RENTAL") {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
        {renderSection("Machine Information", [
          { label: "Brand", value: spec.brand },
          { label: "Model", value: spec.model },
          { label: "Manufacturing Year", value: spec.manufacturingYear },
        ])}
        {renderSection("Technical Specifications", [
          { label: "Engine HP", value: spec.engineHp ? `${spec.engineHp} HP` : null },
          { label: "Fuel Type", value: spec.fuelType },
          { label: "Capacity / Dimensions", value: spec.capacity },
        ])}
        {renderSection("Rental Pricing & Terms", [
          { label: "Hourly Rental Rate", value: spec.rentalHourlyRate ? `₹${spec.rentalHourlyRate}` : null },
          { label: "Daily Rental Rate", value: spec.rentalDailyRate ? `₹${spec.rentalDailyRate}` : null },
          { label: "Security Deposit", value: spec.securityDeposit ? `₹${spec.securityDeposit}` : null },
        ])}
        {renderSection("Services Available", [
          { label: "Operator Available", value: spec.operatorAvailable },
          { label: "Delivery Available", value: spec.deliveryAvailable },
        ])}
      </div>
    );
  }

  if (productType === "MACHINERY_SALES") {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
        {renderSection("Machine Information", [
          { label: "Brand", value: spec.brand },
          { label: "Model", value: spec.model },
          { label: "Variant", value: spec.variant },
          { label: "Manufacturing Year", value: spec.manufacturingYear },
        ])}
        {renderSection("Technical Specifications", [
          { label: "Engine HP", value: spec.engineHp ? `${spec.engineHp} HP` : null },
          { label: "Fuel Type", value: spec.fuelType },
          { label: "Capacity / Dimensions", value: spec.capacity },
        ])}
        {renderSection("Warranty & Services", [
          { label: "Warranty Terms", value: spec.warranty },
          { label: "Delivery Available", value: spec.deliveryAvailable },
          { label: "Installation / Demo", value: spec.installationAvailable },
          { label: "Financing / EMI", value: spec.financingAvailable },
        ])}
      </div>
    );
  }

  // Fallback for missing/unknown product types
  return null;
}
