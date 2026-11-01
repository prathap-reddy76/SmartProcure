"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatus, updateUserRole } from "@/actions/admin/admin-user-actions";
import { Role } from "@prisma/client";
import { RoleBadge } from "../admin-users-client";

export function AdminUserDetailClient({ user, isSelf }: { user: any, isSelf: boolean }) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const newStatus = !user.isActive;
    const res = await toggleUserStatus(user.id, newStatus);
    
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(`User successfully ${newStatus ? 'activated' : 'suspended'}`);
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    
    setIsUpdatingStatus(false);
  };

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      setShowRoleModal(false);
      return;
    }

    setIsUpdatingRole(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateUserRole(user.id, selectedRole);
    
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(`User role successfully changed to ${selectedRole.replace(/_/g, " ")}`);
      setShowRoleModal(false);
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    
    setIsUpdatingRole(false);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-IN", { 
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" 
    });
  };

  return (
    <div className="space-y-6">
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200">{errorMsg}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-semibold border border-green-200">{successMsg}</div>}
      
      {/* Overview & Core Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-gray-900">{user.name || "Unknown User"}</h2>
            <RoleBadge role={user.role} />
            {user.isActive ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-emerald-100 text-emerald-800 border-emerald-200">
                Active
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider bg-gray-100 text-gray-600 border-gray-300">
                Suspended
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p><span className="font-semibold w-16 inline-block">Email:</span> {user.email}</p>
            <p><span className="font-semibold w-16 inline-block">Phone:</span> {user.phone || "N/A"}</p>
            <p><span className="font-semibold w-16 inline-block">Joined:</span> {formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowRoleModal(true)}
            disabled={isSelf || isUpdatingRole}
            className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            Change Role
          </button>
          
          <button
            onClick={handleToggleStatus}
            disabled={isSelf || isUpdatingStatus}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 ${
              user.isActive 
                ? "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isUpdatingStatus ? "Updating..." : user.isActive ? "Suspend Account" : "Reactivate Account"}
          </button>
          {isSelf && <span className="text-xs text-amber-600 text-center">You cannot modify your own admin account.</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Operational Associations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Operational Associations</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shop Link */}
            {user.shop ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">Shop Ownership</span>
                <p className="font-bold text-gray-900">{user.shop.name}</p>
                <p className="text-sm text-gray-600">{user.shop.shopType}</p>
              </div>
            ) : null}

            {/* Delivery Partner */}
            {user.deliveryPartner ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1">Delivery Profile</span>
                <p className="font-bold text-gray-900">{user.deliveryPartner.vehicleType}</p>
                <p className="text-sm text-gray-600">{user.deliveryPartner.vehicleNumber}</p>
              </div>
            ) : null}

            {/* Farmer Profile */}
            {user.farmerProfile ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">Farmer Location</span>
                <p className="font-bold text-gray-900">{[user.farmerProfile.village, user.farmerProfile.district].filter(Boolean).join(", ") || "Unknown Location"}</p>
                <p className="text-sm text-gray-600">{user.farmerProfile.state}</p>
              </div>
            ) : null}

            {/* Procurement Centre */}
            {user.procurementCentre ? (
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                <span className="text-xs font-bold text-pink-800 uppercase tracking-wider block mb-1">Procurement Assignment</span>
                <p className="font-bold text-gray-900">{user.procurementCentre.name}</p>
              </div>
            ) : null}

            {!user.shop && !user.deliveryPartner && !user.farmerProfile && !user.procurementCentre && (
              <div className="p-4 bg-gray-50 text-gray-500 rounded-xl text-sm italic col-span-2 text-center">
                No active operational profiles found.
              </div>
            )}
          </div>
        </div>

        {/* Activity Counts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Activity Summary</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Total Orders:</span> 
              <span className="font-bold text-gray-900">{user._count.orders}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1">
              <span className="text-gray-500">Payments Processed:</span> 
              <span className="font-bold text-gray-900">{user._count.paymentTransactions}</span>
            </div>
            
            {user.role === "MACHINERY_OWNER" && (
              <>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Machinery Listed:</span> 
                  <span className="font-bold text-gray-900">{user._count.ownedMachinery}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Bookings Received:</span> 
                  <span className="font-bold text-gray-900">{user._count.receivedBookings}</span>
                </div>
              </>
            )}

            {user.role === "PROCUREMENT_OFFICER" && (
              <>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Quality Inspections:</span> 
                  <span className="font-bold text-gray-900">{user._count.qualityInspections}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Weighing Ops:</span> 
                  <span className="font-bold text-gray-900">{user._count.weighingOperations}</span>
                </div>
              </>
            )}

            {user.role === "FARMER" && (
              <>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Procurement Sales:</span> 
                  <span className="font-bold text-gray-900">{user._count.procurementBookings}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Machinery Rentals:</span> 
                  <span className="font-bold text-gray-900">{user._count.machineryBookings}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Change User Role</h3>
              <p className="text-sm text-gray-500 mt-1">
                Changing a user's role grants them different permissions. The system will automatically block changes if it would orphan active associations (like an active shop or delivery vehicle).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="FARMER">FARMER</option>
                <option value="SHOP_OWNER">SHOP_OWNER</option>
                <option value="DELIVERY_PARTNER">DELIVERY_PARTNER</option>
                <option value="MACHINERY_OWNER">MACHINERY_OWNER</option>
                <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(user.role);
                }}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
                disabled={isUpdatingRole}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={isUpdatingRole || selectedRole === user.role}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdatingRole ? "Processing..." : "Confirm Role Change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
