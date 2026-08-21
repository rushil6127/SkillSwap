"use client";

import { useState } from "react";
import { Plus, LayoutGrid, Inbox, Coins } from "lucide-react";
import { MarketplaceProvider, CURRENT_USER } from "@/context/MarketplaceContext";
import { SkillSearch } from "@/components/marketplace/SkillSearch";
import { RequestFilters } from "@/components/marketplace/RequestFilters";
import { RequestBoard } from "@/components/marketplace/RequestBoard";
import { MyRequests } from "@/components/marketplace/MyRequests";
import { CreateRequestModal } from "@/components/marketplace/CreateRequestModal";

type Tab = "discover" | "my-requests";

function MarketplaceApp() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: "var(--background)",
        // Added a semi-transparent overlay to decrease the background image's intensity
        backgroundImage: `linear-gradient(rgba(242, 249, 241, 0.5), rgba(242, 249, 241, 0.5)), url('/bgimgage2.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-green-100 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-green-50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>

      {/* ── Navbar ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-green-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-green-900 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-base leading-none">S</span>
            </div>
            <span className="font-extrabold text-xl text-green-900 tracking-tight">SkillSwap</span>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 bg-green-50 border border-green-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab("discover")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "discover"
                ? "bg-[#51874c] text-white shadow-sm"
                : "text-green-700 hover:bg-green-100"
              }`}
            >
              <LayoutGrid size={15} />
              Discover
            </button>
            <button
              onClick={() => setActiveTab("my-requests")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "my-requests"
                ? "bg-[#51874c] text-white shadow-sm"
                : "text-green-700 hover:bg-green-100"
                }`}
            >
              <Inbox size={15} />
              My Requests
            </button>
          </nav>

          {/* Right side: Credits + Avatar + Post button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-green-500 font-medium leading-tight">Balance</span>
              <div className="flex items-center gap-1">
                <Coins size={13} className="text-green-600" />
                <span className="text-sm font-extrabold text-green-800">{CURRENT_USER.creditsBalance} SC</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-green-300 to-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-white text-sm">
                {CURRENT_USER.name.charAt(0)}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-green-900 leading-tight">{CURRENT_USER.name}</p>
                <p className="text-xs text-green-500">{CURRENT_USER.department}</p>
              </div>
            </div>

            <button
              id="post-request-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#51874c] hover:opacity-90 text-white rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Post Request</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === "discover" ? (
          <>
            {/* Hero */}
            <section className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-3 tracking-tight leading-tight">
                Find the help you need.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-green-500">
                  Share your skills.
                </span>
              </h1>
              <p className="text-lg text-green-700 max-w-2xl mx-auto font-medium">
                Join the campus skill marketplace. Trade expertise in coding, design, math, and more for SkillCredits.
              </p>
              <SkillSearch value={searchQuery} onChange={setSearchQuery} />
            </section>

            <section>
              <RequestFilters
                activeCategory={filterCategory}
                onCategoryChange={setFilterCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
              <RequestBoard searchQuery={searchQuery} filterCategory={filterCategory} />
            </section>
          </>
        ) : (
          <MyRequests />
        )}
      </main>

      {/* ── Floating Post button (mobile) ── */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#51874c] hover:opacity-90 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 sm:hidden"
      >
        <Plus size={24} />
      </button>

      {/* ── Create Request Modal ── */}
      {showCreateModal && (
        <CreateRequestModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <MarketplaceProvider>
      <MarketplaceApp />
    </MarketplaceProvider>
  );
}
