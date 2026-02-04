import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Theme gerenciado pelo next-themes (ThemeProvider em App.tsx)
createRoot(document.getElementById("root")!).render(<App />);
