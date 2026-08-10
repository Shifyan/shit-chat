"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/service/chat.service";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, error } = useMe();

  // Auth gate — redirect to login if token is expired/invalid
  useEffect(() => {
    if (error && (error as { status?: number }).status === 401) {
      router.push("/login");
    }
  }, [error, router]);

  return <>{children}</>;
}
