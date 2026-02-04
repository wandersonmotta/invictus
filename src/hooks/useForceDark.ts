import * as React from "react";

/**
 * Hook que força o tema dark ANTES do primeiro render visual.
 * Usa useLayoutEffect para garantir que a classe seja aplicada
 * sincronamente, antes do browser pintar a tela.
 * 
 * Ao desmontar, limpa as classes para que o ThemeProvider reassuma.
 */
export function useForceDark() {
  // useLayoutEffect roda sincronamente ANTES do paint
  React.useLayoutEffect(() => {
    // Força dark imediatamente
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    
    return () => {
      // Ao sair, remove ambas as classes para que o next-themes reassuma
      document.documentElement.classList.remove("dark", "light");
    };
  }, []);
}
