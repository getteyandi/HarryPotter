const OrnateCorner = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    className={`w-10 h-10 text-[#c49a6c] ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {/* Swirly vintage corner */}
    <path d="M2 62 C10 50, 20 50, 20 40 C20 25, 40 25, 40 15 C40 8, 55 8, 62 2" />
    <path d="M15 45 C22 38, 30 38, 34 32" />
    <circle cx="20" cy="40" r="1.5" />
    <circle cx="40" cy="20" r="1.5" />
  </svg>
);

export default OrnateCorner;
