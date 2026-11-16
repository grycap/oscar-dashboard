import ReactDOM from "react-dom/client";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner.tsx";
import AppRouter from "./routes/router.tsx";

// Migrate the former automatic option to an explicit choice before the provider reads storage.
try {
  if (localStorage.getItem("oscar-dashboard-theme") === "system") {
    localStorage.setItem("oscar-dashboard-theme", "light");
  }
} catch {
  // Private browsing can make storage unavailable; next-themes still renders.
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="oscar-dashboard-theme">
    <AuthProvider>
      <Toaster />
      <AppRouter />
    </AuthProvider>
  </ThemeProvider>
);
