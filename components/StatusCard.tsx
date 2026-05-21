export interface CardProps {
  tone: "success" | "error" | "pending";
  title: string;
  body: string;
}

export function StatusCard({ tone, title, body }: CardProps) {
  const palette =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-amber-200 bg-amber-50 text-amber-800";
  const icon = tone === "success" ? "✓" : tone === "error" ? "!" : "⏳";
  return (
    <div className={`w-96 rounded-2xl border p-6 shadow-sm ${palette}`}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-80">{body}</p>
    </div>
  );
}
