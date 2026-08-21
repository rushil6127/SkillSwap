import { formatCredits } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-xl w-full p-8 rounded-card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          Foundation Initialized
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          SkillSwap
        </h1>
        
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Exchange skills. Earn credits. Help your campus.
        </p>

        <div className="p-4 rounded-button bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2 text-left">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Architecture Foundation Status:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Next.js (App Router) + TypeScript</li>
            <li>Tailwind CSS Design System</li>
            <li>Supabase SSR Client Infrastructure</li>
            <li>Starting Balance Target: {formatCredits(20)}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
