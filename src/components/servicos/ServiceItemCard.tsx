import { Card, CardContent } from "@/components/ui/card";

interface ServiceItemCardProps {
  name: string;
  description?: string | null;
  price?: number | null;
  priceLabel?: string | null;
  imageUrl?: string | null;
  contactInfo?: string | null;
}

export function ServiceItemCard({
  name,
  description,
  price,
  priceLabel,
  imageUrl,
  contactInfo,
}: ServiceItemCardProps) {
  return (
    <Card className="overflow-hidden">
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className={imageUrl ? "p-4" : "p-4"}>
        <h4 className="font-semibold text-foreground">{name}</h4>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{description}</p>
        )}
        {price != null && (
          <p className="mt-2 text-primary font-medium">
            {priceLabel ?? "R$"} {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}
        {contactInfo && (
          <p className="mt-2 text-xs text-muted-foreground">{contactInfo}</p>
        )}
      </CardContent>
    </Card>
  );
}
