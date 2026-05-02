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

const CURRENT_VERSION = "2.7.3";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.7.3",
    releaseDate: "2026-04-30",
    title: "Modal Helper Integration Prep",
    summary:
      "This release adds a single appointment modal toolkit import target for the next safe App.tsx cleanup step.",
    capabilities: [
      "Added appointment modal toolkit at src/utils/appointmentModalToolkit.ts.",
      "Grouped appointment draft helpers, resident appointment matching helpers, and appointment sort-time helper behind one import target.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
      "Prepared the next narrow App.tsx replacement step by reducing future import clutter.",
      "No D1 migration is required for this modular cleanup patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Use appointmentModalToolkit in the next narrow App.tsx import-replacement patch.",
      "Continue replacing duplicated App.tsx modal logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Makes the next App.tsx modal cleanup step smaller and easier to review.",
      "Creates a cleaner shared toolkit for appointment modal behavior.",
    ],
  },
  {
    version: "2.7.2",
    releaseDate: "2026-04-30",
    title: "Appointment Modal Helper Foundation",
    summary:
      "This release adds reusable appointment draft helper utilities for the next safe App.tsx modal cleanup step.",
    capabilities: [
      "Added appointment draft helper utilities at src/utils/appointmentDraftHelpers.ts.",
      "Added helpers for new appointment drafts, duplicate appointment drafts, and edit appointment drafts.",
      "Added reusable resident-to-appointment draft application logic with unit resolution.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointmentDraftHelpers in the next narrow App.tsx import-replacement patch.",
      "Continue replacing duplicated App.tsx modal logic in small build-tested steps.",
    ],
    userImpact: [
      "Creates a safer foundation for reducing App.tsx appointment modal logic.",
      "Keeps appointment workflows stable while cleanup continues.",
      "Makes resident selection, duplicate appointment, and new appointment behavior easier to reuse later.",
    ],
  },
  {
    version: "2.7.1",
    releaseDate: "2026-04-30",
    title: "Modular Cleanup Foundation Expansion",
    summary:
      "This release adds the next safe helper modules for resident appointment matching and appointment draft defaults.",
    capabilities: [
      "Added resident appointment matching helper at src/utils/residentAppointmentMatching.ts.",
      "Added appointment draft defaults at src/constants/appointmentDefaults.ts.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use the new resident matching and appointment default modules for the next narrow App.tsx import-replacement patch.",
      "Continue replacing duplicated App.tsx logic in small build-tested steps.",
    ],
    userImpact: [
      "Creates more safe extraction points for reducing App.tsx size.",
      "Keeps current app workflows stable while cleanup continues.",
      "Makes resident history matching and appointment modal defaults easier to reuse later.",
    ],
  },
  {
    version: "2.7.0",
    releaseDate: "2026-04-30",
    title: "App.tsx Modular Cleanup Phase 1",
    summary:
      "This release begins the App.tsx split by adding reusable foundation modules for navigation, dates, string handling, and schedule sorting.",
    capabilities: [
      "Added app navigation metadata module at src/constants/appNavigation.ts.",
      "Added shared date helpers at src/utils/dateHelpers.ts.",
      "Added shared string helper at src/utils/stringHelpers.ts.",
      "Added shared schedule-time helper at src/utils/scheduleTime.ts.",
      "Kept App.tsx behavior stable by avoiding a broad rewrite in this phase.",
    ],
    processFlow: [
      "Use the new helper modules as the foundation for the next narrow App.tsx import-replacement patch.",
      "Continue App.tsx cleanup in small build-tested steps instead of one large rewrite.",
    ],
    userImpact: [
      "Creates a safer foundation for reducing App.tsx size.",
      "Makes future patches easier to review and less likely to break unrelated workflows.",
      "Preserves current app behavior while modular cleanup begins.",
    ],
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
