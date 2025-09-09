export default function SectionDetail({ title, description, buttonText }) {
  return (
    <div className="flex flex-col items-start">
      <h1 className="text-4xl font-bold mt-5">{title}</h1>
      <p className="text-sm text-hp-gray mt-5">{description}</p>

      <button className="z-20 bg-hp-royal px-9  py-3 rounded-full mt-6 cursor-pointer font-bold hover:brightness-80 transition-all">
        {buttonText}
      </button>
    </div>
  );
}
