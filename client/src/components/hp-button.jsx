import { Link } from "react-router-dom";

export default function HpButton({
  text,
  className,
  onClick,
  onMouseEnter,
  glow = false,
  href = "#",
  tooltip = "",
}) {
  return (
    <Link to={href}>
      <div
        className={`group relative flex w-fit justify-center hover:brightness-80 transition-all ${className}`}
      >
        <span className="absolute text-xs text-nowrap -top-6 left-0">
          {tooltip}
        </span>

        <button
          className={`border border-hp-ivory/20 z-20 bg-hp-royal px-9 py-3 rounded-full cursor-pointer font-bold
          ${glow ? "animate-glow" : ""}`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          type="button"
        >
          {text}
        </button>

        {/* Top shine */}
        <span className="w-[50%] -top-[1px] z-50 h-[3px] bg-[linear-gradient(90deg,rgba(74,58,30,0)_0%,rgba(225,203,165,0.4)_50%,rgba(74,58,30,0)_100%)] absolute group-hover:animate-widen transition-all" />

        {/* Bottom shine */}
        <span className="w-[50%] -bottom-[1px] z-50 h-[3px] bg-[linear-gradient(90deg,rgba(74,58,30,0)_0%,rgba(225,203,165,0.4)_50%,rgba(74,58,30,0)_100%)] absolute group-hover:animate-widen transition-all" />
      </div>
    </Link>
  );
}
