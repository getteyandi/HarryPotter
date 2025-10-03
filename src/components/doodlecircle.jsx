const DoodleCircle = ({ className }) => (
  <svg
    className={`w-16 h-16 text-[#6b4a2e] opacity-20 ${className}`}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M10 50 Q 20 10, 50 20 Q 80 30, 70 60 Q 60 90, 30 80 Q 5 70, 10 50 Z" />
  </svg>
);

export default DoodleCircle;
