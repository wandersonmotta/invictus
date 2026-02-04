import * as React from "react";

/**
 * Hook que força o tema dark enquanto o componente está montado.
 * Ao desmontar, limpa as classes para que o ThemeProvider reassuma o controle.
 */
export function useForceDark() {
  React.useEffect(() => {
    // Força dark imediatamente
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    
    return () => {
      // Ao sair, remove ambas as classes para que o next-themes reassuma
      // O ThemeProvider vai reaplicar a classe correta automaticamente
      document.documentElement.classList.remove("dark", "light");
    };
  }, []);
}
