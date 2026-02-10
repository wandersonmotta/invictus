import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Compressão Gzip (padrão)
    viteCompression(), 
    // Compressão Brotli (mais eficiente)
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ].filter(Boolean),
  resolve: {
    // Evita múltiplas instâncias de React no bundle (causa erro de hooks: dispatcher null)
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tooltip', 'lucide-react'],
          utils: ['date-fns', 'zod', 'react-hook-form'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
}));
