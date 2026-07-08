"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Check } from "lucide-react";

export interface SearchableSelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  selectedValue: number;
  onChange: (id: number) => void;
  placeholder: string;
  noOptionsMessage?: string;
}

export function SearchableSelect({
  options,
  selectedValue,
  onChange,
  placeholder,
  noOptionsMessage = "Nenhuma opção encontrada",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === selectedValue);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(term) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(term))
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg h-[38px] px-3 text-white text-left flex justify-between items-center focus:outline-none focus:border-blue-500 transition-colors text-xs"
      >
        <div className="truncate pr-2">
          {selectedOption ? (
            <span className="text-white font-semibold truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-[#111827] border border-[#1f293d] rounded-lg max-h-96 overflow-y-auto z-50 shadow-2xl divide-y divide-[#1f293d]/40">
          <div className="p-2 bg-[#0b0f17] sticky top-0 border-b border-[#1f293d]/60 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Digitar para pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111827] border border-[#1f293d] rounded-md pl-8 pr-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500 font-medium"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="py-1">
            {filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`px-3 py-2 cursor-pointer text-xs flex justify-between items-center transition-colors ${
                  selectedValue === o.id
                    ? "bg-blue-600/20 text-blue-400 font-bold"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <div>
                  <div className="font-semibold">{o.label}</div>
                  {o.sublabel && (
                    <div className="text-[10px] text-gray-500 font-normal">
                      {o.sublabel}
                    </div>
                  )}
                </div>
                {selectedValue === o.id && (
                  <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-gray-500 text-xs italic">
                {noOptionsMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
