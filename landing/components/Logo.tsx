export function Marca({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mv-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#001AD8" />
          <stop offset="1" stopColor="#3145FF" />
        </linearGradient>
      </defs>
      <path d="M3.5 5.5h25L16 27.5 3.5 5.5Z" fill="url(#mv-g)" />
      <path d="M10.5 11.5 16 19l5.5-7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({ tom = "escuro" }: { tom?: "escuro" | "claro" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Marca />
      <span
        className={`font-display text-[17px] font-semibold tracking-tight ${
          tom === "claro" ? "text-white" : "text-ink"
        }`}
      >
        Monvatti
      </span>
    </span>
  );
}
