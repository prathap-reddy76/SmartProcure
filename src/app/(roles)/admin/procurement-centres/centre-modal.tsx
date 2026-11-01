"use client";

import React, { useState } from "react";
import {
  AdminCentreFormData,
  createAdminProcurementCentre,
  updateAdminProcurementCentre,
} from "@/actions/admin/centre-actions";

export interface CentreItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  village: string | null;
  mandal: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  operatingStartTime: string | null;
  operatingEndTime: string | null;
  isActive: boolean;
}

interface CentreModalProps {
  centre?: CentreItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CentreModal({ centre, isOpen, onClose, onSuccess }: CentreModalProps) {
  const isEditing = Boolean(centre);

  const [formData, setFormData] = useState<AdminCentreFormData>({
    name: centre?.name || "",
    code: centre?.code || "",
    description: centre?.description || "",
    address: centre?.address || "",
    village: centre?.village || "",
    mandal: centre?.mandal || "",
    district: centre?.district || "",
    state: centre?.state || "Andhra Pradesh",
    pincode: centre?.pincode || "",
    latitude: centre?.latitude ?? null,
    longitude: centre?.longitude ?? null,
    contactPhone: centre?.contactPhone || "",
    operatingStartTime: centre?.operatingStartTime || "09:00",
    operatingEndTime: centre?.operatingEndTime || "17:00",
    isActive: centre?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: AdminCentreFormData = {
        ...formData,
        latitude:
          formData.latitude === null || formData.latitude === undefined || isNaN(Number(formData.latitude))
            ? null
            : Number(formData.latitude),
        longitude:
          formData.longitude === null || formData.longitude === undefined || isNaN(Number(formData.longitude))
            ? null
            : Number(formData.longitude),
      };

      if (isEditing && centre) {
        const res = await updateAdminProcurementCentre(centre.id, payload);
        if (!res.success) {
          setError(res.error || "Failed to update centre.");
          setLoading(false);
          return;
        }
      } else {
        const res = await createAdminProcurementCentre(payload);
        if (!res.success) {
          setError(res.error || "Failed to create centre.");
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? `Edit Centre: ${centre?.name}` : "Create New Procurement Centre"}
            </h2>
            <p className="text-xs text-gray-500">
              Set geographic coordinates, address details, and operating parameters.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-sm p-1 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Centre Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kurnool Market Yard"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Centre Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PC-KRN-001"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description or purpose of this procurement hub..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          {/* Location & Address */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Geographic Coordinates & Location
            </h4>

            {/* Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Latitude (-90 to +90)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude !== null && formData.latitude !== undefined ? formData.latitude : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: e.target.value === "" ? null : parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g. 15.8281"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Longitude (-180 to +180)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude !== null && formData.longitude !== undefined ? formData.longitude : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: e.target.value === "" ? null : parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g. 78.0373"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              💡 Coordinates enable interactive map pins and accurate distance calculation for farmers.
            </p>

            {/* Address fields */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Market Yard Road, Near APMC"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Village/Town</label>
                <input
                  type="text"
                  value={formData.village || ""}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="Kurnool"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mandal</label>
                <input
                  type="text"
                  value={formData.mandal || ""}
                  onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                  placeholder="Kurnool Urban"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district || ""}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Kurnool"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode || ""}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="518001"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

          {/* Operating Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.contactPhone || ""}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Opens At</label>
              <input
                type="text"
                value={formData.operatingStartTime || "09:00"}
                onChange={(e) => setFormData({ ...formData, operatingStartTime: e.target.value })}
                placeholder="09:00"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Closes At</label>
              <input
                type="text"
                value={formData.operatingEndTime || "17:00"}
                onChange={(e) => setFormData({ ...formData, operatingEndTime: e.target.value })}
                placeholder="17:00"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Status Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-sm border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-bold text-gray-700">
              Active (Visible for farmer procurement bookings & slot discovery)
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Centre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
