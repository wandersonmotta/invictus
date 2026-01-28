// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Mapa</h1>
        <p className="text-sm text-muted-foreground">Perto de mim (raio) com geolocalização — placeholder.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="invictus-surface invictus-frame aspect-[16/10] w-full rounded-lg border border-border/70" />
        </div>

        <aside className="space-y-4">
          <div className="invictus-surface invictus-frame rounded-lg border border-border/70 p-4">
            <h2 className="text-sm font-medium">Raio</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vamos adicionar o seletor 5–50km e filtros aqui.</p>
          </div>
          <div className="invictus-surface invictus-frame rounded-lg border border-border/70 p-4">
            <h2 className="text-sm font-medium">Resultados</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lista de membros próximos (cards) — em breve.</p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Index;
