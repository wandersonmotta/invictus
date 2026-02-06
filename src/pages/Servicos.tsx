import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ServiceCategoryCard } from "@/components/servicos/ServiceCategoryCard";
import { ServiceItemCard } from "@/components/servicos/ServiceItemCard";

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  sort_order: number;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  image_url: string | null;
  contact_info: string | null;
  sort_order: number;
}

export default function Servicos() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories" as any)
        .select("id, name, description, icon_name, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as ServiceCategory[];
    },
  });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["service-items", selectedCategoryId],
    enabled: !!selectedCategoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_items" as any)
        .select("id, name, description, price, price_label, image_url, contact_info, sort_order")
        .eq("category_id", selectedCategoryId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as ServiceItem[];
    },
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {selectedCategoryId ? (
        <>
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCategoryId(null)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              {selectedCategory?.name ?? "Serviços"}
            </h1>
          </div>

          {loadingItems ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum item cadastrado nesta categoria ainda.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <ServiceItemCard
                  key={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  priceLabel={item.price_label}
                  imageUrl={item.image_url}
                  contactInfo={item.contact_info}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Serviços</h1>
          </div>

          {loadingCategories ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma categoria disponível no momento.
            </p>
          ) : (
            <div className="grid gap-3">
              {categories.map((cat) => (
                <ServiceCategoryCard
                  key={cat.id}
                  name={cat.name}
                  description={cat.description}
                  iconName={cat.icon_name}
                  onClick={() => setSelectedCategoryId(cat.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
