import * as React from "react";

/**
 * Hook que força o tema dark temporariamente enquanto o componente está montado.
 * Ao desmontar, restaura o tema que o usuário tinha selecionado.
 */
export function useForceDark() {
  React.useEffect(() => {
    // Guarda o tema atual para restaurar depois
    const hadLight = document.documentElement.classList.contains("light");
    const hadDark = document.documentElement.classList.contains("dark");
    
    // Força dark
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    
    return () => {
      // Restaura ao sair da página
      document.documentElement.classList.remove("dark");
      if (hadLight) {
        document.documentElement.classList.add("light");
      } else if (!hadDark) {
        // Se não tinha nenhum dos dois, deixa o sistema decidir (next-themes vai gerenciar)
        // Não fazemos nada, deixa o ThemeProvider resolver
      }
    };
  }, []);
}
