import { History, CheckCircle2 } from "lucide-react";

interface VersionEntry {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  capabilities: string[];
  processFlow: string[];
  userImpact: string[];
}

const CURRENT_VERSION = "3.0.13";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.0.13",
    releaseDate: "2026-04-30",
    title: "App.tsx Phase A Import Cleanup Complete",
    summary: "Marked Phase A import cleanup complete after App.tsx imports were consolidated through stable barrel paths and build verification passed.",
    capabilities: [
      "Marked App.tsx Phase A import cleanup as complete.",
      "Documented that component, type, hook, service, data utility, and appointment utility imports now use stable barrel paths.",
      "Documented that Phase A verification and production build were completed before closing the phase.",
      "Kept Phase A helper scripts available for future verification or repeat cleanup checks.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Continue using npm run check:app-phase-a when verifying import cleanup health.",
      "Run npm run build before deployment.",
      "Run npx wrangler deploy only after the build passes.",
      "Begin the next cleanup phase with helper/function extraction from App.tsx in small build-tested commits.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Closes Phase A import cleanup.",
      "Prepares the app for the next App.tsx cleanup phase without changing user-facing behavior.",
    ],
  },
  {
    version: "3.0.12",
    releaseDate: "2026-04-30",
    title: "Phase A Completion Checklist",
    summary: "Added one local command to verify Phase A cleanup, run the build, show git status, and review the App.tsx diff.",
    capabilities: ["Added scripts/check-app-phase-a-completion.mjs.", "Added npm script check:app-phase-a."],
    processFlow: ["Run npm run check:app-phase-a locally.", "Commit App.tsx only after verification and build both pass."],
    userImpact: ["Keeps current workflows stable.", "Makes Phase A completion review easier before committing App.tsx."],
  },
  {
    version: "3.0.11",
    releaseDate: "2026-04-30",
    title: "Phase A Build Verification Runner",
    summary: "Added one local command to run Phase A App.tsx import cleanup, verification, and production build.",
    capabilities: ["Added scripts/run-app-phase-a-import-cleanup-build.mjs.", "Added npm script refactor:app-phase-a-build."],
    processFlow: ["Run npm run refactor:app-phase-a-build locally.", "Review git diff src/App.tsx after success."],
    userImpact: ["Keeps current workflows stable.", "Combines Phase A cleanup and build into one local command."],
  },
];

export function VersionHistoryPanel() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <History size={18} className="text-sky-700" /> Version History
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-800 ring-1 ring-sky-100">
          Current v{CURRENT_VERSION}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {VERSION_HISTORY.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === CURRENT_VERSION}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              v{entry.version} — {entry.title}
              {entry.version === CURRENT_VERSION && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  Current
                </span>
              )}
            </summary>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{entry.summary}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <VersionSection title="Capabilities" items={entry.capabilities} />
              <VersionSection title="Workflow" items={entry.processFlow} />
              <VersionSection title="User Impact" items={entry.userImpact} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

const VersionSection = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-3">
    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
    <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="flex gap-2">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);
