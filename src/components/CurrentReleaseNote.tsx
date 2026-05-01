import { CheckCircle2, Database, History, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Hardened password storage using PBKDF2-SHA256 hashes in the existing users.password field.",
  "Added backward-compatible legacy password upgrade so existing plain-text passwords are converted to hashed storage after a successful login.",
  "Updated password setup, new user creation, and user password reset/update flows so new passwords are stored as hashes instead of plain text.",
  "Updated package metadata and visible release notes to identify v2.4.0 as the current security baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.4.0 UI and Worker build remain stable.",
  "No new D1 migration is required because the existing users.password column stores the new hash string.",
  "Deploy the Worker so password hashing is active on login, setup, new user creation, and password update.",
  "Have existing users log in once with their current password so legacy plain-text passwords are automatically upgraded to hashed storage.",
  "Use this baseline as the starting point for the next security pass: session tokens, protected API middleware, and server-side facility authorization.",
];

export function CurrentReleaseNote() {
  return (
    <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-sky-900">
            <History size={18} /> Current Release Note
          </div>
          <h2 className="mt-2 text-lg font-black text-slate-900">
            v2.4.0 — Security Hardening: Password Hashing
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release hardens password storage while preserving existing login continuity through automatic legacy password upgrade after successful login.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Security</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Database size={12} className="mr-1 inline" /> No Migration</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-sky-100 bg-white p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">What changed</p>
          <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
            {releaseItems.map((item, index) => (
              <li key={`release-${index}`} className="flex gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Admin workflow</p>
          <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
            {workflowItems.map((item, index) => (
              <li key={`workflow-${index}`} className="flex gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-sky-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
