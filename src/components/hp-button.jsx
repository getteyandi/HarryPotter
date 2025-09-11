export default function HpButton({ text, className }) {
  return (
    <div
      className={`group relative flex w-fit justify-center hover:brightness-80 transition-all ${className}`}
    >
      <button className="border border-hp-ivory/50 z-20 bg-hp-royal px-9 py-3 rounded-full cursor-pointer font-bold ">
        {text}
      </button>
      <span className="w-[50%] -top-[1px] z-50 h-[3px] bg-[linear-gradient(90deg,rgba(74,58,30,0)_0%,#E1CBA5_50%,rgba(74,58,30,0)_100%)] absolute group-hover:w-[75%] transition-all" />
      <span className="w-[50%] -bottom-[1px] z-50 h-[3px] bg-[linear-gradient(90deg,rgba(74,58,30,0)_0%,#E1CBA5_50%,rgba(74,58,30,0)_100%)] absolute group-hover:w-[75%] transition-all" />
    </div>
  );
}
