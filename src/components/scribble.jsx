const Scribble = ({ className }) => (
  <svg
    className={`w-20 h-10 opacity-70 text-[#7a5c36] ${className}`}
    viewBox="0 0 100 50"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    {/* Random scribbly curves */}
    <path d="M5 25 Q 20 10, 35 25 T 65 25 T 95 25" />
    <path d="M10 40 Q 25 20, 45 35 T 85 35" />
  </svg>
);

export default Scribble;
