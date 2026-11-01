"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { getPostLoginRedirect } from "@/actions/auth/auth-actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password does not meet the required format"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleQuickFill = (email: string, pass: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
    setError("");
  };

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email.trim(),
        password: data.password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Query database directly on the server to get the exact role-based dashboard destination
      // This eliminates any client-side session caching or stale role issues.
      const postLogin = await getPostLoginRedirect();
      if (postLogin.error && !postLogin.redirectUrl.startsWith("/")) {
        setError(postLogin.error);
        setIsLoading(false);
        return;
      }

      // Clean full-page navigation ensures fresh session state and clears any stale layout cache
      window.location.href = postLogin.redirectUrl;
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Log in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
            register as a new farmer
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-xs focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-3 py-2.5 placeholder-gray-400 shadow-xs focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                <div className="text-sm text-red-700 font-medium">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-xl border border-transparent bg-green-600 py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Seeded Accounts Quick-Fill Helper */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Seeded Test Portals
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("officer@smartprocure.com", "Officer@123")}
                className="text-left px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs text-emerald-800 font-medium transition-colors"
              >
                Procurement Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("prathap@gmail.com", "password123")}
                className="text-left px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-xs text-green-800 font-medium transition-colors"
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("your-admin-email@example.com", "password123")}
                className="text-left px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs text-indigo-800 font-medium transition-colors"
              >
                System Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("reddy01@gmail.com", "password123")}
                className="text-left px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs text-amber-800 font-medium transition-colors"
              >
                Shop Owner
              </button>
            </div>
          </div>

          {/* Delivery Partner Portal Link */}
          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-500">
              Are you a Delivery Partner?{" "}
              <Link href="/delivery/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Delivery Partner Portal →
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
