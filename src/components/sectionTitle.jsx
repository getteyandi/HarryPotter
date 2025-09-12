export default function SectionTitle({
  title,
  backgroundColor = "bg-hp-royal",
}) {
  return (
    <div className=" max-w-7xl mx-auto relative flex items-center justify-center ">
      <div className="h-[1px] w-full bg-[linear-gradient(90deg,rgba(74,58,30,0)_0%,#E1CBA5_50%,rgba(74,58,30,0)_100%)]" />
      <div className={`absolute  ${backgroundColor} px-11`}>
        {title && (
          <p className="text-4xl font-bold text-hp-yellow text-shadow-sectiontitle">
            {title}
          </p>
        )}
        <div className="absolute left-0 h-full top-0 flex items-center justify-center pl-2 gap-1.5">
          <div className="h-2 w-2 border-2 border-hp-ivory rotate-45" />
          <div className="h-1 w-1 bg-hp-ivory rotate-45" />
        </div>
        <div className="absolute right-0 h-full top-0 flex items-center justify-center pr-2 gap-1.5">
          <div className="h-1 w-1 bg-hp-ivory rotate-45" />
          <div className="h-2 w-2 border-2 border-hp-ivory rotate-45" />
        </div>
      </div>
    </div>
  );
}
