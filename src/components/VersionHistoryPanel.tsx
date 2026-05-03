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

const CURRENT_VERSION = "3.0.10";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.0.10",
    releaseDate: "2026-04-30",
    title: "App.tsx Phase A Import Cleanup Runner",
    summary: "Added one local command to run the full Phase A App.tsx import cleanup sequence and verifier.",
    capabilities: [
      "Added scripts/run-app-phase-a-import-cleanup.mjs.",
      "Added npm script refactor:app-phase-a.",
      "The runner executes component, type, hook, service, data utility, appointment utility, and Phase A verifier scripts.",
      "Kept App.tsx unchanged in the repository so local build and verifier results remain the source of truth.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run refactor:app-phase-a locally from the repository root.",
      "Run npm run build immediately after the runner completes.",
      "Review git diff src/App.tsx after the build passes.",
      "Commit App.tsx only after verification and build both pass.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Combines Phase A import cleanup into one local command.",
      "Reduces missed steps by running the verifier after all import cleanup scripts.",
    ],
  },
  {
    version: "3.0.9",
    releaseDate: "2026-04-30",
    title: "App.tsx Phase A Import Cleanup Verifier",
    summary: "Added a local verifier to confirm whether all Phase A App.tsx import cleanup groups are complete.",
    capabilities: ["Added scripts/verify-app-phase-a-imports.mjs.", "Added npm script verify:app-phase-a-imports."],
    processFlow: ["Run npm run verify:app-phase-a-imports locally.", "Run npm run build after the verifier passes."],
    userImpact: ["Keeps current workflows stable.", "Confirms whether Phase A import cleanup is complete."],
  },
  {
    version: "3.0.8",
    releaseDate: "2026-04-30",
    title: "App.tsx Appointment Utility Import Cleanup Script",
    summary: "Added a local-safe script to consolidate App.tsx appointment utility imports into the appointment utility barrel path.",
    capabilities: ["Added scripts/refactor-app-appointment-imports-a6.mjs.", "Added npm script refactor:app-appointments."],
    processFlow: ["Run npm run refactor:app-appointments locally.", "Run npm run build immediately after."],
    userImpact: ["Keeps current workflows stable.", "Provides a safer local App.tsx cleanup path."],
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
