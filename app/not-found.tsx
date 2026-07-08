"use client";

import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4 font-sans text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-blue-500 animate-pulse"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-widest font-mono">404</h1>
          <p className="text-sm uppercase tracking-wider text-gray-400 mt-2 font-semibold">Página Não Encontrada</p>
        </div>
        <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-xl shadow-2xl">
          <p className="text-xs text-gray-400 leading-relaxed">
            O recurso que você tentou acessar não foi localizado ou não está disponível no painel do ERP Industrial.
          </p>
        </div>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20"
        >
          Voltar ao Painel
        </a>
      </div>
    </div>
  );
}
