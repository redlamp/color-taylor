export default function NarrativeSlide({ heading, subheading, body }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xl mx-auto">
      {heading && (
        <h2 className="text-5xl font-bold tracking-tight">{heading}</h2>
      )}
      {subheading && (
        <p className="text-xl text-muted-foreground">{subheading}</p>
      )}
      {body && (
        <p className="text-lg text-muted-foreground/80 mt-4">{body}</p>
      )}
    </div>
  );
}
