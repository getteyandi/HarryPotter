const MagicSpark = ({ className }) => (
  <svg
    className={`w-28 h-16 text-[#442d16] opacity-60 ${className}`}
    viewBox="0 0 200 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M20 60 L20 20 L50 60 L50 20" />
    <path d="M80 60 L100 20 L120 60" />
    <path d="M140 60 L160 40 L180 60 L160 20 Z" />
  </svg>
);

export default MagicSpark;
