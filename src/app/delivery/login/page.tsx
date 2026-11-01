"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TruckIcon } from "@/components/ui/icons";
import { getPostLoginRedirect } from "@/actions/auth/auth-actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const SEEDED_PARTNERS = [
  { name: "Ravi Kumar", email: "ravi.kumar@smartprocure.com", role: "Delivery Partner" },
  { name: "Suresh Reddy", email: "suresh.reddy@smartprocure.com", role: "Delivery Partner" },
  { name: "Kiran Kumar", email: "kiran.kumar@smartprocure.com", role: "Delivery Partner" },
  { name: "Venkatesh Naidu", email: "venkatesh.naidu@smartprocure.com", role: "Delivery Partner" },
  { name: "Arjun Varma", email: "arjun.varma@smartprocure.com", role: "Delivery Partner" },
];

export default function DeliveryLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "ravi.kumar@smartprocure.com",
      password: "",
    },
  });

  const handleSelectPartner = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setErrorMessage("");
  };

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email.trim(),
        password: data.password,
      });

      if (result?.error) {
        setErrorMessage("Invalid email or password. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      // Check real database role via server action to prevent client-side session caching
      const postLogin = await getPostLoginRedirect();

      if (postLogin.role === "DELIVERY_PARTNER") {
        window.location.href = postLogin.redirectUrl;
      } else {
        // Non-delivery role attempting access
        const readableRole = postLogin.role ? postLogin.role.replace(/_/g, " ") : "User";
        setErrorMessage(
          `Access restricted: Logged in as ${readableRole}. This portal is exclusively for Delivery Partners. Please use the main portal.`
        );
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <TruckIcon className="w-7 h-7" />
          </div>
        </div>

        <h1 className="text-center text-3xl font-black tracking-tight text-white">
          SmartProcure
        </h1>
        <p className="mt-1 text-center text-sm font-semibold text-blue-400 uppercase tracking-widest">
          Logistics & Delivery Partner Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Partner Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="partner@smartprocure.com"
                  {...register("email")}
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Default test key: <code className="text-blue-300 font-mono">Partner@123</code>
                </span>
              </div>
              <div className="mt-1.5">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5">
                <p className="text-xs font-semibold text-rose-300 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? "Authenticating..." : "Sign In to Dispatch"}
              </button>
            </div>
          </form>

          {/* Quick Account Fill for Seeded Delivery Partners */}
          <div className="mt-6 pt-6 border-t border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Seeded Delivery Partner Accounts
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {SEEDED_PARTNERS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleSelectPartner(p.email)}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/50 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                >
                  <span className="font-semibold text-slate-200 group-hover:text-blue-300">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-300">
                    {p.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Back to Standard Login */}
          <div className="mt-6 pt-4 border-t border-slate-700/80 text-center">
            <p className="text-xs text-slate-400">
              Not a delivery partner?{" "}
              <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Farmer, Shop Owner, Procurement Officer, or Admin Portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
