"use client";

import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function SkillSearch({ value, onChange }: Props) {
  return (
    <div className="relative w-full max-w-2xl mx-auto my-8">
      <div className="absolute inset-0 bg-green-200 blur-xl opacity-30 rounded-full pointer-events-none"></div>
      <div className="relative flex items-center bg-white/95 backdrop-blur-md border border-green-200 rounded-full px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-green-400">
        <div className="relative flex items-center justify-center mr-4 text-green-700 flex-shrink-0">
          <Search size={22} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search skills, requests, or people..."
          className="flex-1 bg-transparent border-none outline-none text-green-900 placeholder:text-green-500/70 text-lg font-medium min-w-0"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="ml-3 text-green-400 hover:text-green-700 transition flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
