/**
 * A section title row without the card: the app's h3 title style, the switch
 * on the right, the content below. The app's CollapsibleSection has a flush
 * variant, but its title is a different size and weight from the card one.
 *
 * Shared by the lab benches, which each compose the picker's Color Editor
 * from the same primitives.
 */
export default function FlatSection({ title, headerRight, children }: { title: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex h-8 items-center justify-between gap-2">
        <h3 className="text-sm font-medium tracking-normal text-foreground/80">{title}</h3>
        {headerRight}
      </div>
      {children}
    </section>
  );
}
