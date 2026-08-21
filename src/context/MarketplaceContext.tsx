"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Offer, SkillRequest } from "@/types/marketplace";

// ── Simulated logged-in user ────────────────────────────────────────────────
export const CURRENT_USER = {
  id: "user-001",
  name: "Rushil Sharma",
  avatar: "",
  department: "Computer Science",
  year: "3rd Year",
  creditsBalance: 150,
};

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_REQUESTS: SkillRequest[] = [
  {
    id: "req-seed-1",
    ownerId: "user-999",
    ownerName: "Alex M.",
    ownerAvatar: "",
    ownerDepartment: "Computer Science",
    ownerYear: "2nd Year",
    title: "Need help setting up a Next.js frontend with Tailwind",
    description:
      "I'm working on a hackathon project and need someone to help me initialize the repository with the correct Tailwind v4 configuration and some base components.",
    skill: "React/Next.js",
    category: "Programming",
    level: "Intermediate",
    creditsOffered: 15,
    duration: "2 hours",
    deadline: "2026-08-24",
    status: "Open",
    offers: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req-seed-2",
    ownerId: "user-888",
    ownerName: "Sarah J.",
    ownerAvatar: "",
    ownerDepartment: "Engineering",
    ownerYear: "4th Year",
    title: "Calculus III Tutoring Before Midterms",
    description:
      "Struggling with multiple integrals and vector fields. Need someone who can explain it clearly for about 2 hours this weekend.",
    skill: "Mathematics",
    category: "Math & Science",
    level: "Advanced",
    creditsOffered: 30,
    duration: "2 sessions",
    deadline: "2026-08-27",
    status: "Open",
    offers: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req-seed-3",
    ownerId: "user-777",
    ownerName: "David K.",
    ownerAvatar: "",
    ownerDepartment: "Business",
    ownerYear: "3rd Year",
    title: "Figma UI/UX review for my startup idea",
    description:
      "I have wireframes ready but the visual hierarchy feels off. Looking for an experienced design student to critique and suggest improvements.",
    skill: "UI/UX Design",
    category: "Design",
    level: "Expert",
    creditsOffered: 20,
    duration: "1 hour",
    deadline: "2026-08-30",
    status: "Open",
    offers: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req-seed-4",
    ownerId: "user-666",
    ownerName: "Emily R.",
    ownerAvatar: "",
    ownerDepartment: "Linguistics",
    ownerYear: "2nd Year",
    title: "Spanish conversation practice",
    description:
      "Looking for a native speaker to chat with for an hour to prepare for my oral exam next week.",
    skill: "Spanish",
    category: "Languages",
    level: "Beginner",
    creditsOffered: 10,
    duration: "1 hour",
    deadline: "2026-08-25",
    status: "Offer Received",
    offers: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req-seed-5",
    ownerId: "user-555",
    ownerName: "Michael T.",
    ownerAvatar: "",
    ownerDepartment: "Data Science",
    ownerYear: "4th Year",
    title: "Help debugging a Python machine learning script",
    description:
      "My PyTorch model keeps throwing a dimension mismatch error during training. Need a second pair of eyes to spot the issue in the tensors.",
    skill: "Python/ML",
    category: "Programming",
    level: "Intermediate",
    creditsOffered: 25,
    duration: "1–2 hours",
    deadline: "2026-08-22",
    status: "Open",
    offers: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "req-seed-6",
    ownerId: "user-444",
    ownerName: "Jessica W.",
    ownerAvatar: "",
    ownerDepartment: "Environmental Sci",
    ownerYear: "1st Year",
    title: "Logo design for a student club",
    description:
      "We are starting a new hiking club and need a simple, vector-based logo. Have sketches, just need someone to digitize it in Illustrator.",
    skill: "Graphic Design",
    category: "Design",
    level: "Intermediate",
    creditsOffered: 15,
    duration: "Flexible",
    deadline: "2026-09-05",
    status: "Open",
    offers: [],
    createdAt: new Date().toISOString(),
  },
];

// ── Context ──────────────────────────────────────────────────────────────────
interface MarketplaceContextType {
  requests: SkillRequest[];
  addRequest: (req: Omit<SkillRequest, "id" | "ownerId" | "ownerName" | "ownerAvatar" | "ownerDepartment" | "ownerYear" | "status" | "offers" | "createdAt">) => void;
  updateRequest: (id: string, updates: Partial<SkillRequest>) => void;
  deleteRequest: (id: string) => void;
  addOffer: (requestId: string, offer: Omit<Offer, "id" | "requestId" | "createdAt">) => void;
  acceptOffer: (requestId: string, offerId: string) => void;
  rejectOffer: (requestId: string, offerId: string) => void;
  myRequests: SkillRequest[];
}

const MarketplaceContext = createContext<MarketplaceContextType | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<SkillRequest[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("skillswap_requests");
    if (stored) {
      setRequests(JSON.parse(stored));
    } else {
      setRequests(SEED_REQUESTS);
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    if (requests.length > 0) {
      localStorage.setItem("skillswap_requests", JSON.stringify(requests));
    }
  }, [requests]);

  const addRequest: MarketplaceContextType["addRequest"] = (fields) => {
    const newReq: SkillRequest = {
      id: `req-${Date.now()}`,
      ownerId: CURRENT_USER.id,
      ownerName: CURRENT_USER.name,
      ownerAvatar: CURRENT_USER.avatar,
      ownerDepartment: CURRENT_USER.department,
      ownerYear: CURRENT_USER.year,
      status: "Open",
      offers: [],
      createdAt: new Date().toISOString(),
      ...fields,
    };
    setRequests((prev) => [newReq, ...prev]);
  };

  const updateRequest: MarketplaceContextType["updateRequest"] = (id, updates) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRequest: MarketplaceContextType["deleteRequest"] = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const addOffer: MarketplaceContextType["addOffer"] = (requestId, offerFields) => {
    const offer: Offer = {
      ...offerFields,
      id: `offer-${Date.now()}`,
      requestId,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          offers: [...r.offers, offer],
          status: "Offer Received",
        };
      })
    );
  };

  const acceptOffer: MarketplaceContextType["acceptOffer"] = (requestId, offerId) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          status: "In Progress",
          offers: r.offers.map((o) =>
            o.id === offerId
              ? { ...o, status: "Accepted" }
              : { ...o, status: "Rejected" }
          ),
        };
      })
    );
  };

  const rejectOffer: MarketplaceContextType["rejectOffer"] = (requestId, offerId) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const updated = r.offers.map((o) =>
          o.id === offerId ? { ...o, status: "Rejected" as const } : o
        );
        const stillPending = updated.some((o) => o.status === "Pending");
        return {
          ...r,
          status: stillPending ? "Offer Received" : "Open",
          offers: updated,
        };
      })
    );
  };

  const myRequests = requests.filter((r) => r.ownerId === CURRENT_USER.id);

  return (
    <MarketplaceContext.Provider
      value={{ requests, addRequest, updateRequest, deleteRequest, addOffer, acceptOffer, rejectOffer, myRequests }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used inside MarketplaceProvider");
  return ctx;
}
