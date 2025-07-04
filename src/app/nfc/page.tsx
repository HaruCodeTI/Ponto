import React from "react";
import { NFCReader } from "@/components/nfc/nfc-reader";

export default function NFCDemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-center">Leitor de Crachá NFC</h1>
      <div className="w-full max-w-md">
        <NFCReader />
      </div>
    </main>
  );
} 