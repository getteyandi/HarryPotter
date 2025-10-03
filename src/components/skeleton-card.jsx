export default function SkeletonCard(key) {
  return (
    <div
      key={key}
      className={
        "relative w-64 h-102 p-2 rounded-2xl shadow-2xl border-3 border-[#593811] bg-[#35291C] overflow-hidden animate-pulse"
      }
    >
      <div className="w-full h-64 bg-white/10 rounded-t-lg border-b-[#a2823b] border-b-3" />
      <div className="p-3 space-y-3">
        <div className="h-3.5 rounded bg-white/10 w-2/3" />
        <div className="flex gap-2">
          <div className="h-3 rounded bg-white/10 w-1/3" />
          <div className="h-3 rounded bg-white/10 w-1/4" />
          <div className="h-3 rounded bg-white/10 w-1/5" />
        </div>
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 24px rgba(0,0,0,0.35)" }}
      />
    </div>
  );
}
