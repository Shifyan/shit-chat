"use client";

import React, { useState } from "react";
import {
  Chat,
  ArrowRight,
  Eye,
  EyeSlash,
  GoogleLogo,
  AppleLogo,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/service/auth.service";
import { ApiError } from "@/lib/swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  const {
    trigger: login,
    isMutating: isLoggingIn,
    error: loginError,
  } = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ method: "POST", body: formData });
      console.log(res);
      // Handle success — e.g., redirect or show toast
      router.push("/");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-md bg-[#F9FAFB]">
      {/* Decorative Atmosphere */}
      <div className="fixed top-0 left-0 w-full h-1 bg-primary/10"></div>

      {/* Login Container */}
      <main className="w-full max-w-[400px] animate-[fadeIn_0.6s_ease-out_forwards]">
        {/* Logo / Branding Anchor */}
        <div className="my-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-default ">
            <Chat weight="fill" className="text-on-primary size-6" />
          </div>
          <h1 className="text-[24px] font-bold text-primary tracking-tight my-2">
            SHIT CHAT
          </h1>
          <p className="text-[14px] text-secondary ">
            Calm, focused communication.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant py-lg px-xl shadow-[0px_10px_30px_rgba(0,0,0,0.02)] rounded-default">
          <header className="mb-lg text-center">
            <h2 className="text-[24px] font-semibold text-primary leading-headline-lg">
              Welcome back
            </h2>
          </header>

          <form className="space-y-lg" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-sm">
              <label
                className={`block text-[12px] font-medium uppercase tracking-widest leading-label-md transition-colors duration-150 ${
                  emailFocused ? "text-primary font-semibold" : "text-secondary"
                }`}
                htmlFor="email"
              >
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-sm">
              <div className="flex justify-between items-center">
                <label
                  className={`block text-[12px] font-medium uppercase tracking-widest leading-label-md transition-colors duration-150 ${
                    passwordFocused
                      ? "text-primary font-semibold"
                      : "text-secondary"
                  }`}
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="text-[11px] font-semibold text-secondary hover:text-primary transition-colors leading-label-sm"
                  href="#"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="pr-10"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeSlash className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full h-12 text-[14px] font-bold flex items-center justify-center gap-sm active:scale-[0.98] transition-transform cursor-pointer text-white"
              type="submit"
            >
              Sign In
              <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-xl">
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center"
            >
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase leading-label-sm font-semibold">
              <span className="bg-surface-container-lowest px-md text-secondary tracking-widest">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-md">
            <button className="flex items-center justify-center h-11 border border-outline-variant text-[14px] text-primary hover:bg-surface-container-low transition-colors bg-transparent rounded-default gap-sm cursor-pointer font-medium">
              <GoogleLogo className="size-5" />
              Google
            </button>
            <button className="flex items-center justify-center h-11 border border-outline-variant text-[14px] text-primary hover:bg-surface-container-low transition-colors bg-transparent rounded-default gap-sm cursor-pointer font-medium">
              <AppleLogo className="size-5" />
              Apple
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <footer className="mt-xl text-center">
          <p className="text-[14px] text-secondary leading-body-md">
            Don't have an account?{" "}
            <a
              className="text-primary font-bold hover:underline decoration-1 underline-offset-4 transition-all"
              href="/register"
            >
              Create an account
            </a>
          </p>
        </footer>
      </main>

      {/* Sticky footer parameters */}
      <div className="fixed bottom-0 left-0 w-full p-lg flex justify-between items-center pointer-events-none">
        <span className="text-[11px] text-outline-variant tracking-widest leading-label-sm">
          VER 2.4.0
        </span>
        <span className="text-[11px] text-outline-variant tracking-widest uppercase leading-label-sm">
          Privacy / Terms
        </span>
      </div>
    </div>
  );
}
