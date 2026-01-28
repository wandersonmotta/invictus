const Home = () => {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Fraternidade Invictus</h1>
        <p className="text-sm text-muted-foreground">
          Um espaço de irmandade, disciplina e elevação — conexões reais, propósito e ação.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="invictus-surface invictus-frame rounded-lg border border-border/70 p-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Manifesto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A Invictus existe para forjar caráter e fortalecer vínculos. Aqui, honra, lealdade e responsabilidade
            pessoal não são discurso — são prática.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Use o Mapa para encontrar irmãos por proximidade, Buscar para descobrir perfis e Mensagens para manter a
            comunicação direta.
          </p>
        </article>

        <aside className="space-y-4">
          <div className="invictus-surface invictus-frame rounded-lg border border-border/70 p-4">
            <h2 className="text-sm font-medium">Comece por aqui</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vá em <span className="font-medium text-foreground">Mapa</span> para ver quem está perto.
            </p>
          </div>
          <div className="invictus-surface invictus-frame rounded-lg border border-border/70 p-4">
            <h2 className="text-sm font-medium">Conduta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Respeito, discrição e intenção. Fortaleça a irmandade com ações.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Home;
