// File: ./src/components/SWRProvider.tsx
"use client";

import { SWRConfig } from "swr";
import React from "react";

export default function SWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        // Masukkan konfigurasi global SWR Anda di sini jika ada
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
