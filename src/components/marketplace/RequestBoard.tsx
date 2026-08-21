"use client";

import { useState } from "react";
import { Clock, GraduationCap, HandHeart, Coins } from "lucide-react";
import { useMarketplace, CURRENT_USER } from "@/context/MarketplaceContext";
import { SkillRequest, STATUS_COLORS, RequestStatus } from "@/types/marketplace";
import { OfferPanel } from "./OfferPanel";

function RequestCard({ request }: { request: SkillRequest }) {
  const [showPanel, setShowPanel] = useState(false);

  const daysLeft = Math.ceil(
    (new Date(request.deadline).getTime() - Date.now()) / 86400000
  );
  const deadlineLabel =
    daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`;

  return (
    <>
      <div className="group flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-green-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden h-full">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-50 rounded-full blur-2xl opacity-50 group-hover:bg-green-100 transition-colors"></div>

        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-block px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wider">
                {request.skill}
              </span>
              <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-600 text-xs font-semibold rounded-full">
                {request.level}
              </span>
              <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${STATUS_COLORS[request.status as RequestStatus]}`}>
                {request.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-green-900 leading-tight group-hover:text-green-700 transition-colors">
              {request.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-2xl border border-green-200 ml-3 flex-shrink-0">
            <Coins size={14} className="text-green-600" />
            <span className="font-bold text-green-800 text-sm">{request.creditsOffered}</span>
            <span className="text-xs font-semibold text-green-500">SC</span>
          </div>
        </div>

        <p className="text-green-800/80 text-sm mb-4 line-clamp-3 flex-grow relative z-10">
          {request.description}
        </p>

        <div className="mt-auto relative z-10">
          <div className="flex items-center gap-4 text-xs font-medium text-green-600 mb-4 pb-4 border-b border-green-100 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-green-400" />
              {request.duration}
            </div>
            <div className="flex items-center gap-1.5">
              <GraduationCap size={13} className="text-green-400" />
              {request.ownerDepartment}
            </div>
            <div className={`ml-auto font-semibold ${daysLeft <= 1 ? "text-red-500" : "text-green-600"}`}>
              {deadlineLabel}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-green-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-green-800 text-sm flex-shrink-0">
                {request.ownerName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-green-900 leading-tight">{request.ownerName}</p>
                <p className="text-xs text-green-500 font-medium">
                  {request.ownerYear} · {request.ownerDepartment}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-800 text-white hover:bg-green-700 transition-all shadow-md text-sm font-bold"
            >
              <HandHeart size={16} />
              <span>View</span>
            </button>
          </div>
        </div>
      </div>

      {showPanel && (
        <OfferPanel request={request} onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}

export function RequestBoard({ searchQuery = "", filterCategory = "" }: { searchQuery?: string; filterCategory?: string }) {
  const { requests } = useMarketplace();

  const filtered = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !filterCategory || filterCategory === "All" || r.category === filterCategory;
    // Hide completed/cancelled from main board
    const isActive = r.status !== "Completed" && r.status !== "Cancelled";
    return matchesSearch && matchesCategory && isActive;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HandHeart size={28} className="text-green-500" />
        </div>
        <p className="text-lg font-bold text-green-900">No requests found</p>
        <p className="text-sm text-green-600 mt-1">Try a different search or filter</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-green-900 mb-1">Public Request Board</h2>
          <p className="text-green-600 font-medium text-sm">
            {filtered.length} active request{filtered.length !== 1 ? "s" : ""} — earn SkillCredits by helping out
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
