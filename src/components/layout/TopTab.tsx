type TopTabProps = {
  active: boolean;
  onClick: () => void;
  label: string;
};

export function TopTab({ active, onClick, label }: TopTabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
        active
          ? "bg-brand text-white shadow-[0_6px_16px_rgba(11,42,111,.18)]"
          : "text-slate-500 hover:bg-brand-light hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}