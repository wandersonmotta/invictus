import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";

type Category = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

type Training = {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  youtube_url: string;
  cover_url: string | null;
  sort_order: number;
};

export default function ClassPage() {
  const { data: categories } = useQuery({
    queryKey: ["training_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_categories")
        .select("id,name,description,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: trainings } = useQuery({
    queryKey: ["trainings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("id,category_id,title,description,youtube_url,cover_url,sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Training[];
    },
  });

  const grouped = React.useMemo(() => {
    const byCat = new Map<string, Training[]>();
    (trainings ?? []).forEach((t) => {
      const key = t.category_id ?? "__no_category__";
      byCat.set(key, [...(byCat.get(key) ?? []), t]);
    });
    return byCat;
  }, [trainings]);

  return (
    <main className="space-y-6 sm:space-y-8">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Class</h1>
        <p className="invictus-lead">Treinamentos gravados — organizado por categorias.</p>
      </header>

      {(categories ?? []).length === 0 ? (
        <Card className="invictus-surface invictus-frame border border-border/70 p-4 text-sm text-muted-foreground">
          Nenhuma categoria cadastrada ainda. Peça para um Admin adicionar categorias e treinamentos.
        </Card>
      ) : (
        <section className="space-y-8">
          {categories?.map((cat) => {
            const items = grouped.get(cat.id) ?? [];
            return (
              <section key={cat.id} className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide">{cat.name}</h2>
                  {cat.description && <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>}
                </div>

                {items.length === 0 ? (
                  <Card className="invictus-surface invictus-frame border border-border/70 p-4 text-sm text-muted-foreground">
                    Sem treinamentos nessa categoria ainda.
                  </Card>
                ) : (
                  <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-px-4">
                    <div className="flex gap-4 min-w-max pb-3">
                      {items.map((t) => (
                        <a
                          key={t.id}
                          href={t.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group block snap-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          title={t.title}
                        >
                          <div className="w-[clamp(140px,42vw,188px)]">
                            <div className="invictus-surface invictus-frame border border-border/70 overflow-hidden rounded-lg">
                              <div className="relative aspect-[2/3]">
                                {t.cover_url ? (
                                  <img
                                    src={t.cover_url}
                                    alt={`Capa do treinamento ${t.title}`}
                                    loading="lazy"
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-muted/20" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-background/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                  <p className="text-xs font-semibold leading-snug">{t.title}</p>
                                </div>
                              </div>
                            </div>

                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.title}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </section>
      )}
    </main>
  );
}
