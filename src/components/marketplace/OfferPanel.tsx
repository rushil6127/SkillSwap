"use client";

import { useState } from "react";
import { X, Star, CheckCircle2, XCircle, MessageCircle, User } from "lucide-react";
import { useMarketplace } from "@/context/MarketplaceContext";
import { Offer, SkillRequest } from "@/types/marketplace";

interface Props {
  request: SkillRequest;
  onClose: () => void;
}

function OfferCard({
  offer,
  onAccept,
  onReject,
  isOwner,
  requestStatus,
}: {
  offer: Offer;
  onAccept: () => void;
  onReject: () => void;
  isOwner: boolean;
  requestStatus: string;
}) {
  const isPending = offer.status === "Pending";
  const isAccepted = offer.status === "Accepted";
  const isRejected = offer.status === "Rejected";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isAccepted
          ? "border-green-300 bg-green-50"
          : isRejected
          ? "border-gray-200 bg-gray-50 opacity-60"
          : "border-green-100 bg-white hover:border-green-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-900 text-sm flex-shrink-0">
            {offer.providerName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-green-900 text-sm">{offer.providerName}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-green-600">{offer.providerDepartment}</p>
              <div className="flex items-center gap-0.5">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-green-700">{offer.providerRating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
            isAccepted
              ? "bg-green-200 text-green-800"
              : isRejected
              ? "bg-gray-200 text-gray-600"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {offer.status}
        </span>
      </div>

      {/* Message */}
      <div className="mt-3 pl-13">
        <div className="flex items-start gap-2">
          <MessageCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 italic">&ldquo;{offer.message}&rdquo;</p>
        </div>
      </div>

      {/* Action buttons (only for owner of the request, on pending offers, and if not already in progress) */}
      {isOwner && isPending && requestStatus === "Offer Received" && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-800 hover:bg-green-900 text-white rounded-xl text-sm font-bold transition shadow-sm"
          >
            <CheckCircle2 size={16} />
            Accept
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition"
          >
            <XCircle size={16} />
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export function OfferPanel({ request, onClose }: Props) {
  const { acceptOffer, rejectOffer, CURRENT_USER } = useMarketplace() as ReturnType<typeof useMarketplace> & {CURRENT_USER?: never};
  const [offerMsg, setOfferMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const { addOffer } = useMarketplace();

  const isOwner = request.ownerId === "user-001"; // CURRENT_USER.id
  const canOffer =
    !isOwner &&
    (request.status === "Open" || request.status === "Offer Received");

  const handleSendOffer = () => {
    if (!offerMsg.trim()) return;
    setSending(true);
    setTimeout(() => {
      addOffer(request.id, {
        providerName: "Rushil Sharma",
        providerAvatar: "",
        providerDepartment: "Computer Science",
        providerRating: 4.8,
        message: offerMsg.trim(),
        status: "Pending",
      });
      setSending(false);
      setOfferSent(true);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 42, 29, 0.5)", backdropFilter: "blur(6px)" }}
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-green-700 px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-bold text-green-100 mb-2 uppercase tracking-wider">
              {request.skill} • {request.level}
            </span>
            <h2 className="text-lg font-bold text-white leading-tight">{request.title}</h2>
            <div className="flex items-center gap-3 mt-2 text-green-200 text-xs font-medium">
              <span>🏆 {request.creditsOffered} SC</span>
              <span>⏱ {request.duration}</span>
              <span>📅 Due {request.deadline}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Description */}
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <p className="text-sm text-green-800 leading-relaxed">{request.description}</p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-100">
              <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-900 text-xs">
                {request.ownerName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-green-900">{request.ownerName}</p>
                <p className="text-xs text-green-600">{request.ownerDepartment} · {request.ownerYear}</p>
              </div>
            </div>
          </div>

          {/* Offers Section */}
          <div>
            <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
              <User size={16} className="text-green-600" />
              {isOwner ? "Incoming Offers" : "Offers"} ({request.offers.length})
            </h3>

            {request.offers.length === 0 ? (
              <div className="text-center py-8 text-green-400">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No offers yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {request.offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isOwner={isOwner}
                    requestStatus={request.status}
                    onAccept={() => acceptOffer(request.id, offer.id)}
                    onReject={() => rejectOffer(request.id, offer.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Offer Help Form */}
          {canOffer && !offerSent && (
            <div className="border-t border-green-100 pt-4">
              <h3 className="text-sm font-bold text-green-900 mb-2">Send an Offer</h3>
              <textarea
                value={offerMsg}
                onChange={(e) => setOfferMsg(e.target.value)}
                placeholder="Introduce yourself and explain how you can help..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-green-200 outline-none focus:ring-2 focus:ring-green-400 text-green-900 placeholder:text-green-400 resize-none text-sm"
              />
              <button
                onClick={handleSendOffer}
                disabled={!offerMsg.trim() || sending}
                className="mt-2 w-full py-3 bg-green-800 hover:bg-green-900 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  "Offer Help 🤝"
                )}
              </button>
            </div>
          )}

          {offerSent && (
            <div className="border-t border-green-100 pt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                <CheckCircle2 size={16} />
                Offer sent! The requester will review it soon.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
