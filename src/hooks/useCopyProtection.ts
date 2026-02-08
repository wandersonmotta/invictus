import { useEffect } from "react";

/**
 * Proteção anti-cópia para a landing page.
 * Bloqueia: clique direito, atalhos de teclado, arrastar imagens.
 * Exibe aviso de propriedade intelectual no console.
 */
export function useCopyProtection() {
  useEffect(() => {
    // 1. Aviso no console (estilo Facebook)
    const warningStyle =
      "color:#d4a017;font-size:18px;font-weight:bold;text-shadow:1px 1px 2px rgba(0,0,0,.4)";
    const bodyStyle = "color:#888;font-size:13px";
    console.log(
      "%c⚠ PARE!",
      warningStyle
    );
    console.log(
      "%cEste conteúdo é propriedade intelectual da Invictus Fraternidade.\nA cópia, reprodução ou engenharia reversa deste site é estritamente proibida.\nQualquer violação está sujeita a medidas legais.",
      bodyStyle
    );

    // 2. Bloquear clique direito
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 3. Bloquear atalhos de teclado
    const blockShortcuts = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      if (ctrl) {
        const blocked = ["u", "s", "c", "a"];
        if (blocked.includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
        // Ctrl+Shift+I / Ctrl+Shift+J
        if (e.shiftKey && ["i", "j"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
      }
    };

    // 4. Bloquear arrastar imagens
    const blockDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === "IMG") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockShortcuts);
    document.addEventListener("dragstart", blockDrag);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockShortcuts);
      document.removeEventListener("dragstart", blockDrag);
    };
  }, []);
}
