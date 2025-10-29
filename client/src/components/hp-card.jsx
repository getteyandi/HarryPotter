export default function HpCard({ title, imageUrl, className }) {
  return (
    <div className={`group relative [perspective:1000px] ${className}`}>
      <div className="bg-gradient-to-tr border border-hp-ivory/20 from-hp-royal to-hp-royal/40 relative w-full h-full rounded-xl shadow-2xl transition-transform duration-500 group-hover:[transform:rotateX(8deg)_rotateY(0deg)_translateZ(20px)] overflow-hidden">
        <img
          src={imageUrl}
          alt="Card"
          className="w-full h-full object-cover rounded-xl"
        />

        {/* Shine effect */}
        <div className="absolute inset-0 pointer-events-none rounded-xl before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:skew-x-12 before:transition-transform before:duration-700"></div>

        {/* Overlay info */}
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-tr from-black/90 via-hp-royal/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-4 rounded-xl">
          <h3 className="font-bold group-hover:-translate-y-0 translate-y-20 transition-transform mb-1 duration-500">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}
