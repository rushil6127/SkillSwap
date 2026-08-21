"use client";

import { useState } from "react";
import { Clock, GraduationCap, Pencil, Trash2, HandHeart, Eye, AlertTriangle, Coins } from "lucide-react";
import { useMarketplace, CURRENT_USER } from "@/context/MarketplaceContext";
import { SkillRequest, STATUS_COLORS, RequestStatus } from "@/types/marketplace";
import { CreateRequestModal } from "./CreateRequestModal";
import { OfferPanel } from "./OfferPanel";

function DeleteConfirmModal({
  request,
  onConfirm,
  onCancel,
}: {
  request: SkillRequest;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 42, 29, 0.5)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-green-900 mb-2">Delete Request?</h3>
        <p className="text-sm text-green-700 mb-1">
          You are about to delete:
        </p>
        <p className="text-sm font-semibold text-green-900 mb-5 px-4 py-2 bg-green-50 rounded-xl">
          &ldquo;{request.title}&rdquo;
        </p>
        <p className="text-xs text-red-500 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-green-200 text-green-700 font-semibold hover:bg-green-50 transition text-sm"
          >
            Keep It
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition text-sm shadow-sm"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MyRequestCard({ request }: { request: SkillRequest }) {
  const { deleteRequest } = useMarketplace();
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showOffers, setShowOffers] = useState(false);

  const daysLeft = Math.ceil(
    (new Date(request.deadline).getTime() - Date.now()) / 86400000
  );
  const deadlineLabel =
    daysLeft < 0
      ? "Overdue"
      : daysLeft === 0
      ? "Due today"
      : daysLeft === 1
      ? "1 day left"
      : `${daysLeft} days left`;

  return (
    <>
      <div className="group bg-white rounded-3xl p-6 border border-green-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-50 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[request.status as RequestStatus]}`}>
                {request.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {request.skill}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                {request.level}
              </span>
            </div>
            <h3 className="font-bold text-green-900 text-lg leading-tight mb-2 truncate">
              {request.title}
            </h3>
            <p className="text-sm text-green-700/80 line-clamp-2 mb-4">{request.description}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="w-9 h-9 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 flex items-center justify-center text-green-700 transition"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-500 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs font-medium text-green-600 relative z-10 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Coins size={13} className="text-green-500" />
            {request.creditsOffered} SkillCredits
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-green-400" />
            {request.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap size={13} className="text-green-400" />
            {request.category}
          </div>
          <div className={`flex items-center gap-1.5 ml-auto font-semibold ${daysLeft <= 1 ? "text-red-500" : "text-green-600"}`}>
            {deadlineLabel}
          </div>
        </div>

        {/* Offers summary + view button */}
        <div className="mt-4 pt-4 border-t border-green-100 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <HandHeart size={16} className="text-green-500" />
            <span className="text-sm font-semibold text-green-800">
              {request.offers.length} offer{request.offers.length !== 1 ? "s" : ""}
            </span>
            {request.offers.some((o) => o.status === "Pending") && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {request.offers.filter((o) => o.status === "Pending").length} pending
              </span>
            )}
          </div>
          <button
            onClick={() => setShowOffers(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-800 hover:bg-green-900 text-white text-sm font-bold transition shadow-sm"
          >
            <Eye size={15} />
            View Details
          </button>
        </div>
      </div>

      {showDelete && (
        <DeleteConfirmModal
          request={request}
          onConfirm={() => {
            deleteRequest(request.id);
            setShowDelete(false);
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showEdit && (
        <CreateRequestModal
          onClose={() => setShowEdit(false)}
          editData={{
            id: request.id,
            title: request.title,
            description: request.description,
            skill: request.skill,
            category: request.category,
            level: request.level,
            creditsOffered: request.creditsOffered,
            duration: request.duration,
            deadline: request.deadline,
          }}
        />
      )}

      {showOffers && (
        <OfferPanel request={request} onClose={() => setShowOffers(false)} />
      )}
    </>
  );
}

export function MyRequests() {
  const { myRequests } = useMarketplace();

  if (myRequests.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <HandHeart size={36} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-900 mb-2">No requests yet</h3>
        <p className="text-green-600 max-w-xs mx-auto">
          Post your first skill help request and let your campus community know how they can help!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-green-900 mb-2">My Requests</h2>
        <p className="text-green-700 font-medium">
          Manage your posted requests and review incoming offers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {myRequests.map((req) => (
          <MyRequestCard key={req.id} request={req} />
        ))}
      </div>
    </div>
  );
}
