"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export function ToastListener() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const toastPayload = localStorage.getItem("toast");
      const parsedPayload = JSON.parse(toastPayload || "{}");
      if (toastPayload) {
        toast.success(parsedPayload.title, {
          description: parsedPayload.description,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("toast");
    }
  }, [pathname]);
  return null;
}
