// Shared types for the marketplace feature

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type RequestStatus =
  | "Open"
  | "Offer Received"
  | "Accepted"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface Offer {
  id: string;
  requestId: string;
  providerName: string;
  providerAvatar: string;
  providerDepartment: string;
  providerRating: number;
  message: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
}

export interface SkillRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerDepartment: string;
  ownerYear: string;
  title: string;
  description: string;
  skill: string;
  category: string;
  level: SkillLevel;
  creditsOffered: number;
  duration: string;
  deadline: string;
  status: RequestStatus;
  offers: Offer[];
  createdAt: string;
}

export const CATEGORIES = [
  "Programming",
  "Design",
  "Math & Science",
  "Languages",
  "Health & Medicine",
  "Business",
  "Music & Arts",
  "Writing",
  "Engineering",
  "Other",
] as const;

export const SKILL_LEVELS: SkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

export const STATUS_COLORS: Record<RequestStatus, string> = {
  Open: "bg-green-100 text-green-800",
  "Offer Received": "bg-blue-100 text-blue-700",
  Accepted: "bg-purple-100 text-purple-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Completed: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-100 text-red-600",
};
