"use client";

import { Clock, GraduationCap, MapPin, HandHeart } from "lucide-react";

export interface RequestData {
  id: string;
  title: string;
  skill: string;
  level: string;
  description: string;
  reward: number;
  deadline: string;
  requesterName: string;
  department: string;
  avatar: string;
  status: string;
}

export function RequestCard({ request }: { request: RequestData }) {
  return (
    <div className="group flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-green-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden h-full">
      {/* Decorative background element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-green-50 rounded-full blur-2xl opacity-50 group-hover:bg-green-100 transition-colors"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            {request.skill} • {request.level}
          </span>
          <h3 className="text-xl font-bold text-green-900 leading-tight mb-2 group-hover:text-green-700 transition-colors">
            {request.title}
          </h3>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-2xl border border-green-200">
            <span className="font-bold text-green-800">{request.reward}</span>
            <span className="text-xs font-semibold text-green-600">Credits</span>
          </div>
        </div>
      </div>

      <p className="text-green-800/80 text-sm mb-6 line-clamp-3 flex-grow relative z-10">
        {request.description}
      </p>

      <div className="mt-auto relative z-10">
        <div className="flex items-center gap-4 text-xs font-medium text-green-600 mb-6 pb-4 border-b border-green-100">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-green-400" />
            {request.deadline}
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap size={14} className="text-green-400" />
            {request.department}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-green-800 text-sm">
              {request.avatar ? (
                <img src={request.avatar} alt={request.requesterName} className="w-full h-full object-cover" />
              ) : (
                request.requesterName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-green-900">{request.requesterName}</p>
              <p className="text-xs text-green-500 font-medium">Needs help</p>
            </div>
          </div>
          
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-green-800 text-white hover:bg-green-700 hover:scale-105 transition-all shadow-md group-hover:w-auto group-hover:px-4 group-hover:gap-2">
            <HandHeart size={18} />
            <span className="hidden group-hover:inline text-sm font-bold whitespace-nowrap">Offer Help</span>
          </button>
        </div>
      </div>
    </div>
  );
}
