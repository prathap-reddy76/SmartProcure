"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProcurementIcon } from "@/components/ui/icons";
import { getPostLoginRedirect } from "@/actions/auth/auth-actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ProcurementOfficerLoginPage() {
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
      email: "officer@smartprocure.com",
      password: "",
    },
  });

  const handleQuickFill = (email: string, pass: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
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

      // Check real database role via server action
      const postLogin = await getPostLoginRedirect();

      if (postLogin.role === "PROCUREMENT_OFFICER") {
        window.location.href = postLogin.redirectUrl;
      } else {
        const readableRole = postLogin.role ? postLogin.role.replace(/_/g, " ") : "User";
        setErrorMessage(
          `Access restricted: Logged in as ${readableRole}. This portal is exclusively for Procurement Officers. Please use the main portal.`
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <ProcurementIcon className="w-7 h-7" />
          </div>
        </div>

        <h1 className="text-center text-3xl font-black tracking-tight text-white">
          SmartProcure
        </h1>
        <p className="mt-1 text-center text-sm font-semibold text-emerald-400 uppercase tracking-widest">
          Procurement Officer Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Officer Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  placeholder="officer@smartprocure.com"
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs font-medium text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                {isLoading ? "Signing in..." : "Sign In to Officer Portal"}
              </button>
            </div>
          </form>

          {/* Quick-Fill Helper for Seeded Procurement Officer */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Seeded Officer Account
            </span>
            <button
              type="button"
              onClick={() => handleQuickFill("officer@smartprocure.com", "Officer@123")}
              className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 transition-colors group flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Ramesh Procurement Officer
                </p>
                <p className="text-[11px] text-slate-400">officer@smartprocure.com</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                Fill
              </span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              &larr; Back to SmartProcure Main Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
