import HpButton from "./hp-button";

export default function SectionDetail({
  title,
  description,
  buttonText,
  buttonText2,
  descriptionAllignment = "text-left",
  descriptionClassName = "",
  buttonHref = "#",
  buttonHref2 = "#",
}) {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className={` ${descriptionClassName}`}>
        {title && (
          <h1 className="text-2xl md:text-4xl font-bold mt-5">{title}</h1>
        )}
        {description && (
          <p
            className={`w-full max-w-126 text-sm text-hp-gray mt-5 ${descriptionAllignment}`}
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {buttonText && <HpButton text={buttonText} href={buttonHref} />}
        {buttonText2 && <HpButton text={buttonText2} href={buttonHref2} />}
      </div>
    </div>
  );
}
