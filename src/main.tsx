import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "sonner";
import AppRouter from "./routes/router.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster />
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
