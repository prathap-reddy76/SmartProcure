"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/actions/notifications/preference-actions";

interface PreferencesClientProps {
  initialPreferences: UserNotificationPreferences;
}

export function PreferencesClient({
  initialPreferences,
}: PreferencesClientProps) {
  const [preferences, setPreferences] =
    useState<UserNotificationPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSavedSuccess(false);
  };

  const handleTestSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateUserNotificationPreferences(preferences);
    setIsSaving(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="pb-4 border-b border-gray-200">
        <Link
          href="/notifications"
          className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
        >
          &larr; Back to Notification Center
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-2">
          Notification Preferences
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize which real-time events and alerts appear on your devices.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>Your notification preferences have been saved successfully!</span>
        </div>
      )}

      {/* Categories Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Event Categories</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Control which transactional updates send real-time alerts. Critical database records remain securely audited regardless of these settings.
          </p>
        </div>

        <div className="space-y-4 divide-y divide-gray-100">
          {/* Procurement */}
          <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Procurement Updates
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Bookings, tokens, queue turns, weighing finalization, and payment receipts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("procurement")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.procurement ? "bg-green-700" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={preferences.procurement}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.procurement ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Orders */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Marketplace & Orders
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Order confirmation, seller packing, dispatch readiness, and cancellations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("orders")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.orders ? "bg-green-700" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={preferences.orders}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.orders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Delivery */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Delivery & Logistics
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Rider assignment, pickup, out-for-delivery, and successful delivery handoffs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("delivery")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.delivery ? "bg-green-700" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={preferences.delivery}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.delivery ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* System */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                System & Announcements
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Maintenance schedules, policy notices, and market intelligence announcements.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("system")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.system ? "bg-green-700" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={preferences.system}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.system ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Delivery Format Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Display & Alerts</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure how notifications appear on your screen while using SmartProcure.
          </p>
        </div>

        <div className="space-y-4 divide-y divide-gray-100">
          {/* Floating Toasts */}
          <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Real-Time Floating Toasts
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Show non-intrusive popups at the bottom corner for newly arriving notifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("toasts")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.toasts ? "bg-green-700" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={preferences.toasts}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.toasts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Sound */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Sound Alert</h4>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-md transition-colors"
                  title="Test Sound"
                >
                  🔊 Test Sound
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Play a gentle audio chime when an event arrives (defaults to OFF).
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("sound")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.sound ? "bg-green-700" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={preferences.sound}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.sound ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/notifications"
          className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors shadow-2xs"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
