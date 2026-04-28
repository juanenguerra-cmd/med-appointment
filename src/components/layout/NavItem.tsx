import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type NavItemProps = {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
};

export function NavItem({ active, onClick, icon, label }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
        active
          ? "bg-brand text-white shadow-[0_8px_18px_rgba(11,42,111,.20)]"
          : "text-slate-600 hover:bg-white hover:text-brand"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <ChevronRight
        size={16}
        className={`transition-transform ${active ? "translate-x-1" : ""}`}
      />
    </button>
  );
}