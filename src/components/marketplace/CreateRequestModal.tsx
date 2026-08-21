"use client";

import { useState } from "react";
import { X, Sparkles, Clock, Coins, Calendar, ChevronDown } from "lucide-react";
import { useMarketplace } from "@/context/MarketplaceContext";
import { CATEGORIES, SKILL_LEVELS, SkillLevel } from "@/types/marketplace";

interface Props {
  onClose: () => void;
  editData?: {
    id: string;
    title: string;
    description: string;
    skill: string;
    category: string;
    level: SkillLevel;
    creditsOffered: number;
    duration: string;
    deadline: string;
  } | null;
}

const DURATION_PRESETS = [
  "30 minutes",
  "1 hour",
  "2 hours",
  "Half day",
  "Full day",
  "Multiple sessions",
  "Flexible",
];

export function CreateRequestModal({ onClose, editData }: Props) {
  const { addRequest, updateRequest } = useMarketplace();
  const isEditing = !!editData;

  const [form, setForm] = useState({
    title: editData?.title ?? "",
    description: editData?.description ?? "",
    skill: editData?.skill ?? "",
    category: editData?.category ?? "",
    level: (editData?.level ?? "Intermediate") as SkillLevel,
    creditsOffered: editData?.creditsOffered ?? 10,
    duration: editData?.duration ?? "",
    deadline: editData?.deadline ?? "",
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.skill.trim()) e.skill = "Skill is required";
    if (!form.category) e.category = "Category is required";
    if (form.creditsOffered < 1 || form.creditsOffered > 200)
      e.creditsOffered = "Credits must be between 1 and 200" as unknown as never;
    if (!form.duration.trim()) e.duration = "Duration is required";
    if (!form.deadline) e.deadline = "Deadline is required";
    else if (new Date(form.deadline) < new Date())
      e.deadline = "Deadline must be in the future";
    setErrors(e as Partial<typeof form>);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    setTimeout(() => {
      if (isEditing && editData) {
        updateRequest(editData.id, form);
      } else {
        addRequest(form);
      }
      setSubmitting(false);
      setSuccess(true);
      setTimeout(onClose, 1200);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 42, 29, 0.5)", backdropFilter: "blur(6px)" }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-green-700 px-8 py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Edit Request" : "Post a Request"}
              </h2>
              <p className="text-green-200 text-sm">
                {isEditing ? "Update your skill request" : "Find a student who can help you"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {isEditing ? "Request Updated!" : "Request Posted!"}
              </p>
              <p className="text-green-600 mt-1">
                {isEditing ? "Your changes have been saved." : "Students can now discover your request."}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-8 py-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-green-900 mb-1.5">
              Request Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Need React help for hackathon project"
              className={`w-full px-4 py-3 rounded-xl border ${errors.title ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 placeholder:text-green-400 transition`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-green-900 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe what you need help with, your current progress, and what a successful session looks like..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border ${errors.description ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 placeholder:text-green-400 resize-none transition`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Skill + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-green-900 mb-1.5">
                Skill Required <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.skill}
                onChange={(e) => set("skill", e.target.value)}
                placeholder="e.g. React, Calculus, Figma"
                className={`w-full px-4 py-3 rounded-xl border ${errors.skill ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 placeholder:text-green-400 transition`}
              />
              {errors.skill && <p className="mt-1 text-xs text-red-500">{errors.skill}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-green-900 mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.category ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 appearance-none bg-white transition cursor-pointer`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
              </div>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm font-semibold text-green-900 mb-2">
              Required Skill Level
            </label>
            <div className="flex gap-2 flex-wrap">
              {SKILL_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => set("level", lvl)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    form.level === lvl
                      ? "bg-green-800 text-white border-green-800 shadow-sm"
                      : "bg-white text-green-700 border-green-200 hover:border-green-400"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Credits + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-green-900 mb-1.5">
                <span className="flex items-center gap-1.5"><Coins size={14} className="text-green-600" /> SkillCredits Offered</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form.creditsOffered}
                  onChange={(e) => set("creditsOffered", Number(e.target.value))}
                  className={`w-full px-4 py-3 pr-16 rounded-xl border ${errors.creditsOffered ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 transition`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-500">SC</span>
              </div>
              {errors.creditsOffered && <p className="mt-1 text-xs text-red-500">{String(errors.creditsOffered)}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-green-900 mb-1.5">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-green-600" /> Duration</span>
              </label>
              <div className="relative">
                <select
                  value={DURATION_PRESETS.includes(form.duration) ? form.duration : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") set("duration", e.target.value);
                    else set("duration", "");
                  }}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.duration ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 appearance-none bg-white transition cursor-pointer`}
                >
                  <option value="">Select duration</option>
                  {DURATION_PRESETS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="custom">Custom...</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
              </div>
              {(!DURATION_PRESETS.includes(form.duration) || form.duration === "") && (
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                  placeholder="e.g. 3 sessions, 45 min"
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-green-200 outline-none focus:ring-2 focus:ring-green-400 text-green-900 placeholder:text-green-400 text-sm transition"
                />
              )}
              {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-green-900 mb-1.5">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-green-600" /> Deadline</span>
            </label>
            <input
              type="date"
              value={form.deadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("deadline", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.deadline ? "border-red-300 bg-red-50" : "border-green-200"} outline-none focus:ring-2 focus:ring-green-400 text-green-900 transition`}
            />
            {errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-green-100 flex items-center justify-between flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-green-700 font-semibold border border-green-200 hover:bg-green-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-green-800 hover:bg-green-900 text-white font-bold shadow-sm transition disabled:opacity-60"
          >
            {submitting ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Sparkles size={16} />
            )}
            {isEditing ? "Save Changes" : "Post Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
