import HpButton from "./hp-button";

export default function SectionDetail({
  title,
  description,
  buttonText,
  descriptionAllignment = "text-left",
  descriptionClassName = "",
}) {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className={` ${descriptionClassName}`}>
        {title && <h1 className="text-4xl font-bold mt-5">{title}</h1>}
        {description && (
          <p
            className={`max-w-lg text-sm text-hp-gray mt-5 ${descriptionAllignment}`}
          >
            {description}
          </p>
        )}
      </div>
      {buttonText && <HpButton text={buttonText} />}
    </div>
  );
}
