"use client";

import dynamic from "next/dynamic";
import { ErpProvider } from "@/hooks/use-erp";
import { Cpu } from "lucide-react";

const ErpAppWithNoSSR = dynamic(
  () => import("@/components/ErpApp").then((mod) => mod.ErpApp),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center">
          <Cpu className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
          <span className="font-mono text-xl font-black tracking-widest text-white">
            MACORATY<b className="text-blue-500">.ERP</b>
          </span>
          <p className="text-xs text-gray-400 mt-2">Carregando ambiente...</p>
        </div>
      </div>
    ),
  }
);

export default function Page() {
  return (
    <ErpProvider>
      <ErpAppWithNoSSR />
    </ErpProvider>
  );
}
