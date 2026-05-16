export default function NarrativeSlide({ heading, subheading, body, introText }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center max-w-2xl mx-auto">
      {heading && (
        <h2 className="text-5xl font-bold tracking-tight">{heading}</h2>
      )}
      {subheading && (
        <p className="text-xl text-muted-foreground">{subheading}</p>
      )}
      {body && (
        <p className="text-lg text-muted-foreground/80 mt-4">{body}</p>
      )}
      {introText && (
        <div className="flex flex-col gap-4 mt-6 text-left">
          {introText.map((para, i) => (
            <p key={i} className="text-base text-muted-foreground/90 leading-relaxed">{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}
