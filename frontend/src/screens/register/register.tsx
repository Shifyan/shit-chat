"use client";

import React, { useState } from "react";
import {
  Chat,
  ArrowRight,
  Eye,
  EyeSlash,
  GoogleLogo,
  GithubLogo,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>(
    {},
  );
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setBackgroundStyle({
      background: `radial-gradient(circle at ${x}% ${y}%, #ffffff 0%, #f9f9ff 100%)`,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // registration logic goes here
    console.log("Submit registration:", formData);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-gutter py-xl selection:bg-primary-fixed selection:text-primary transition-all duration-150"
      style={backgroundStyle}
      onMouseMove={handleMouseMove}
    >
      <div className="w-full max-w-[400px] animate-[fadeIn_0.6s_ease-out_forwards]">
        {/* Brand Identity */}
        <div className="mb-xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-default mb-lg">
            <Chat weight="fill" className="text-on-primary size-6" />
          </div>
          <h1 className="text-headline-lg font-semibold tracking-tight text-primary leading-headline-lg">
            Create an account
          </h1>
          <p className="text-body-md text-secondary mt-sm leading-body-md">
            Start your focused conversation today.
          </p>
        </div>

        {/* Signup Form */}
        <form className="space-y-lg" onSubmit={handleSubmit}>
          <div className="space-y-sm">
            <label
              className="text-label-md font-medium text-secondary block leading-label-md"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jane Doe"
              required
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-sm">
            <label
              className="text-label-md font-medium text-secondary block leading-label-md"
              htmlFor="email"
            >
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <label
                className="text-label-md font-medium text-secondary block leading-label-md"
                htmlFor="password"
              >
                Password
              </label>
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
            <p className="text-label-sm font-semibold text-secondary mt-xs leading-label-sm">
              Must be at least 8 characters long.
            </p>
          </div>

          <div className="pt-sm">
            <Button
              className="w-full h-11 text-label-md font-medium rounded-default flex items-center justify-center gap-sm cursor-pointer"
              type="submit"
            >
              Get Started
              <ArrowRight className="size-4.5" />
            </Button>
          </div>
        </form>

        {/* Social/Alt Signup */}
        <div className="mt-lg">
          <div className="relative flex items-center py-sm">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink mx-md text-label-sm font-semibold text-outline leading-label-sm">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>
          <div className="grid grid-cols-2 gap-md mt-sm">
            <button className="h-11 border border-outline-variant rounded-default flex items-center justify-center gap-sm text-label-md font-medium text-primary hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent">
              <GoogleLogo className="size-5" />
              Google
            </button>
            <button className="h-11 border border-outline-variant rounded-default flex items-center justify-center gap-sm text-label-md font-medium text-primary hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent">
              <GithubLogo className="size-5" style={{ fill: "currentColor" }} />
              GitHub
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-md text-center pointer-events-none">
        <p className="text-label-sm text-outline opacity-40 leading-label-sm">
          © 2024 ChatApp Inc. All rights reserved.
        </p>
      </div>
    </main>
  );
}
