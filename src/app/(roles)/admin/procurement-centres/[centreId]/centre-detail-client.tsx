"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatUTCDate } from "@/lib/date-utils";
import { addCropToCentre, assignOfficerToCentre } from "@/actions/admin/centre-detail-actions";
import { toggleCentreCropStatus, createProcurementSlot, updateProcurementSlotCapacity, deactivateProcurementSlot } from "@/actions/admin/centre-detail-actions";

export function AdminCentreDetailClient({ 
  centreId, 
  supportedCrops, 
  slots, 
  officers, 
  stats, 
  coords 
}: { 
  centreId: string;
  supportedCrops: any[];
  slots: any[];
  officers: any[];
  availableOfficers?: any[];
  allCrops?: any[];
  prices?: any[];
  stats: { totalBookings: number, waiting: number, inProgress: number, completed: number };
  coords: { lat: number | null, lng: number | null };
}) {
  const { availableOfficers = [], allCrops = [], prices = [] } = arguments[0];
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("");
  const [newSlotEnd, setNewSlotEnd] = useState("");
  const [newSlotCapacity, setNewSlotCapacity] = useState("");

  const handleToggleCrop = async (id: string, currentStatus: boolean) => {
    setLoadingAction(`crop-${id}`);
    setError(null);
    const res = await toggleCentreCropStatus(id, !currentStatus);
    if (!res.success) setError(res.error || "Failed to toggle crop.");
    else router.refresh();
    setLoadingAction(null);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("create-slot");
    setError(null);
    const res = await createProcurementSlot(centreId, newSlotDate, newSlotStart, newSlotEnd, parseInt(newSlotCapacity, 10));
    if (!res.success) setError(res.error || "Failed to create slot.");
    else {
      setNewSlotDate(""); setNewSlotStart(""); setNewSlotEnd(""); setNewSlotCapacity("");
      router.refresh();
    }
    setLoadingAction(null);
  };

  const handleAssignOfficer = async () => {
    const officerMap = availableOfficers.map((o: any, idx: number) => ({ ...o, displayId: idx + 1 }));
    const promptText = "Enter Officer Number to assign:\n\n" + officerMap.map((o: any) => `${o.displayId}. ${o.name || o.email}`).join("\n");
    const idStr = prompt(promptText);
    if (!idStr) return;
    const selectedOfficer = officerMap.find((o: any) => o.displayId.toString() === idStr.trim());
    if (!selectedOfficer) {
      alert("Invalid Officer Number.");
      return;
    }
    setLoadingAction("assign-officer");
    setError(null);
    const res = await assignOfficerToCentre(centreId, selectedOfficer.id);
    if (!res.success) setError(res.error || "Failed to assign officer.");
    else router.refresh();
    setLoadingAction(null);
  };

  const handleAddCrop = async () => {
    const cropMap = allCrops.map((c: any, idx: number) => ({ ...c, displayId: idx + 1 }));
    const promptText = "Enter Crop Number to support:\n\n" + cropMap.map((c: any) => `${c.displayId}. ${c.name}`).join("\n");
    const idStr = prompt(promptText);
    if (!idStr) return;
    const selectedCrop = cropMap.find((c: any) => c.displayId.toString() === idStr.trim());
    if (!selectedCrop) {
      alert("Invalid Crop Number.");
      return;
    }
    const capacity = prompt("Enter daily capacity (quintals):", "500");
    if (!capacity || isNaN(parseInt(capacity))) return;
    setLoadingAction("add-crop");
    setError(null);
    const res = await addCropToCentre(centreId, selectedCrop.id, parseInt(capacity));
    if (!res.success) setError(res.error || "Failed to add crop.");
    else router.refresh();
    setLoadingAction(null);
  };

  const handleUpdateCapacity = async (slotId: string, newCapacity: number) => {
    const p = prompt("Enter new capacity:", newCapacity.toString());
    if (!p) return;
    const c = parseInt(p, 10);
    if (isNaN(c)) return alert("Invalid capacity");
    
    setLoadingAction(`slot-${slotId}`);
    setError(null);
    const res = await updateProcurementSlotCapacity(slotId, c);
    if (!res.success) setError(res.error || "Failed to update capacity.");
    else router.refresh();
    setLoadingAction(null);
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-bold rounded-xl">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 text-center">
          <p className="text-sm text-gray-500 font-bold mb-1">Today's Bookings</p>
          <p className="text-3xl font-black text-gray-900">{stats.totalBookings}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-center">
          <p className="text-sm text-amber-600 font-bold mb-1">Currently Waiting</p>
          <p className="text-3xl font-black text-amber-700">{stats.waiting}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 text-center">
          <p className="text-sm text-blue-600 font-bold mb-1">In Progress</p>
          <p className="text-3xl font-black text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 text-center">
          <p className="text-sm text-emerald-600 font-bold mb-1">Completed</p>
          <p className="text-3xl font-black text-emerald-700">{stats.completed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Supported Crops */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center justify-between w-full"><h2 className="font-bold text-gray-900 text-sm">Supported Crops</h2><button onClick={handleAddCrop} className="text-xs text-indigo-600 font-medium hover:underline">Add Crop</button></div>
            </div>
            <div className="p-5 space-y-3">
              {supportedCrops.length === 0 ? (
                <p className="text-sm text-gray-500">No crops configured.</p>
              ) : (
                supportedCrops.map(sc => (
                  <div key={sc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{sc.crop.name}</p>
                      <p className="text-xs text-gray-500">{sc.minimumQuantity}q - {sc.maximumQuantity}q limits</p>
                    </div>
                    <button
                      disabled={loadingAction === `crop-${sc.id}`}
                      onClick={() => handleToggleCrop(sc.id, sc.isActive)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        sc.isActive 
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {loadingAction === `crop-${sc.id}` ? "..." : sc.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Officers */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-gray-900 text-sm">Assigned Officers ({officers.length})</h2><button onClick={handleAssignOfficer} className="text-xs text-indigo-600 font-medium hover:underline">Change / Assign Officer</button></div>
            </div>
            <div className="p-5 space-y-2">
              {officers.length === 0 ? (
                <p className="text-sm text-gray-500">No officers assigned.</p>
              ) : (
                officers.map(off => (
                  <div key={off.id} className="p-2 bg-gray-50 rounded text-sm text-gray-800">
                    {off.name} <span className="text-gray-400">({off.email})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Capacity Planning) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-bold text-gray-900 text-sm">Capacity Planning (Upcoming Slots)</h2>
            </div>
            
            {/* Create Slot Form */}
            <form onSubmit={handleCreateSlot} className="p-5 border-b border-gray-100 bg-indigo-50/50 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                <input type="date" required value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Start Time</label>
                <input type="time" required value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">End Time</label>
                <input type="time" required value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Capacity</label>
                <input type="number" min="1" required value={newSlotCapacity} onChange={e => setNewSlotCapacity(e.target.value)} placeholder="e.g. 50" className="px-3 py-2 bg-white border border-gray-300 rounded text-sm w-24" />
              </div>
              <button disabled={loadingAction === "create-slot"} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded shadow-xs">
                {loadingAction === "create-slot" ? "Adding..." : "+ Add Slot"}
              </button>
            </form>

            {/* Slots Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="p-3 font-bold">Date & Time</th>
                    <th className="p-3 font-bold text-center">Capacity</th>
                    <th className="p-3 font-bold text-center">Booked</th>
                    <th className="p-3 font-bold text-center">Utilization</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slots.map(s => {
                    const util = s.capacity > 0 ? (s.bookedCount / s.capacity) * 100 : 0;
                    return (
                      <tr key={s.id} className={!s.isActive ? "bg-gray-50 opacity-60" : "hover:bg-gray-50/50"}>
                        <td className="p-3 font-medium text-gray-900">
                          {formatUTCDate(s.date, "dd MMM yyyy")} <span className="text-gray-500 font-normal">({s.startTime} - {s.endTime})</span>
                          {!s.isActive && <span className="ml-2 text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">Inactive</span>}
                        </td>
                        <td className="p-3 text-center font-mono">{s.capacity}</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-700">{s.bookedCount}</td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] mx-auto">
                            <div className={`h-2.5 rounded-full ${util >= 100 ? 'bg-red-500' : util >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(util, 100)}%` }}></div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{util.toFixed(1)}%</p>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button 
                            onClick={() => handleUpdateCapacity(s.id, s.capacity)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                          >
                            Edit Cap
                          </button>
                          {s.isActive && s.bookedCount === 0 && (
                            <button 
                              onClick={async () => {
                                if (!confirm('Deactivate slot?')) return;
                                const res = await deactivateProcurementSlot(s.id);
                                if (!res.success) alert(res.error); else router.refresh();
                              }}
                              className="text-red-600 hover:text-red-800 text-xs font-bold"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {slots.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No upcoming slots found. Add one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
