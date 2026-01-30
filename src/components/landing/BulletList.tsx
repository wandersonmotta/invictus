export function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="invictus-stagger space-y-2 text-sm text-muted-foreground">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
