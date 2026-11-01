"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAdminUser } from "@/actions/admin/admin-user-actions";

export default function NewAdminUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as any,
      password: formData.get("password") as string,
      isActive: formData.get("isActive") === "on",
    };

    if (data.password !== formData.get("confirmPassword")) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const res = await createAdminUser(data);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin/users");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/admin/users" className="text-sm font-bold text-gray-500 hover:text-gray-900">
          &larr; Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Create New User</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 text-sm font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors"
                placeholder="Jane Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors"
                placeholder="+91..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Role *</label>
              <select
                name="role"
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors"
              >
                <option value="DELIVERY_PARTNER">Driver / Delivery Partner</option>
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Account is Active
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
