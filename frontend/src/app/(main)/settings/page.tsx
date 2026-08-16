"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Lock } from "@phosphor-icons/react";
import {
  useMe,
  useUpdateProfile,
  useChangePassword,
} from "@/service/chat.service";
import { useSWRConfig } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: me } = useMe();
  const { mutate } = useSWRConfig();
  const { trigger: updateProfile, isMutating: savingProfile } =
    useUpdateProfile();
  const { trigger: changePassword, isMutating: savingPassword } =
    useChangePassword();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Seed form with current profile once loaded
  const [seeded, setSeeded] = useState(false);
  if (me && !seeded) {
    setFullname(me.fullname);
    setEmail(me.email);
    setSeeded(true);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    const body: { fullname?: string; email?: string } = {};
    if (fullname.trim() !== me.fullname) body.fullname = fullname.trim();
    if (email.trim() !== me.email) body.email = email.trim();
    if (Object.keys(body).length === 0) return;

    try {
      const updated = await updateProfile({ method: "PATCH", body });
      await mutate("/me", updated, { revalidate: false });
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to update profile", {
        description: (err as { message?: string })?.message,
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePassword({
        method: "PUT",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Failed to change password", {
        description: (err as { message?: string })?.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* Header */}
      <header className=" sticky top-0 z-10 bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-2xl mx-auto px-lg h-16 flex items-center gap-md">
          <Link
            href="/"
            className="p-2 hover:bg-surface-container-low rounded-full cursor-pointer"
            aria-label="Back to chats"
          >
            <ArrowLeft className="size-5 text-secondary" />
          </Link>
          <h1 className="text-headline-lg font-bold text-primary leading-headline-lg">
            Settings
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-lg py-lg space-y-lg">
        {/* Profile */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-default p-lg">
          <header className="flex items-center gap-sm mb-lg">
            <User className="size-5 text-primary" />
            <h2 className="text-body-lg font-bold text-primary">Profile</h2>
          </header>
          <form className="space-y-lg" onSubmit={handleSaveProfile}>
            <div className="space-y-sm">
              <label
                htmlFor="fullname"
                className="block text-label-sm font-medium uppercase tracking-widest text-secondary"
              >
                Full Name
              </label>
              <Input
                id="fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-sm">
              <label
                htmlFor="email"
                className="block text-label-sm font-medium uppercase tracking-widest text-secondary"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full h-11 text-label-md font-bold cursor-pointer text-white disabled:opacity-50"
            >
              {savingProfile ? "Saving…" : "Save Profile"}
            </Button>
          </form>
        </section>

        {/* Password */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-default p-lg">
          <header className="flex items-center gap-sm mb-lg">
            <Lock className="size-5 text-primary" />
            <h2 className="text-body-lg font-bold text-primary">
              Change Password
            </h2>
          </header>
          <form className="space-y-lg" onSubmit={handleChangePassword}>
            <div className="space-y-sm">
              <label
                htmlFor="current-password"
                className="block text-label-sm font-medium uppercase tracking-widest text-secondary"
              >
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-sm">
              <label
                htmlFor="new-password"
                className="block text-label-sm font-medium uppercase tracking-widest text-secondary"
              >
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-sm">
              <label
                htmlFor="confirm-password"
                className="block text-label-sm font-medium uppercase tracking-widest text-secondary"
              >
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              disabled={savingPassword}
              className="w-full h-11 text-label-md font-bold cursor-pointer text-white disabled:opacity-50"
            >
              {savingPassword ? "Saving…" : "Change Password"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
