export function VerificationBadge({ label, verified }: { label: string; verified: boolean }) {
  const styles = verified
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-500";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <span aria-hidden>{verified ? "✓" : "○"}</span>
      {label}
    </span>
  );
}

export function ReputationBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
      {score} reputation
    </span>
  );
}
