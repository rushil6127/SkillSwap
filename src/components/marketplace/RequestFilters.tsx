"use client";

import { CATEGORIES } from "@/types/marketplace";

interface Props {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const ALL_CATEGORIES = ["All", ...CATEGORIES];

export function RequestFilters({ activeCategory, onCategoryChange, sortBy, onSortChange }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 p-4 bg-green-50/50 rounded-2xl border border-green-100">
      <div className="flex flex-wrap gap-2 flex-1">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat
                ? "bg-[#51874c] text-white shadow-sm"
                : "bg-white text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-white border border-green-200 text-green-900 text-sm rounded-xl focus:ring-green-400 focus:border-green-400 block p-2.5 outline-none shadow-sm cursor-pointer hover:border-green-300 transition-colors flex-shrink-0"
      >
        <option value="newest">Sort: Newest</option>
        <option value="credits">Sort: Highest Credits</option>
        <option value="deadline">Sort: Soonest Deadline</option>
      </select>
    </div>
  );
}
