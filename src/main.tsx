import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import AppRouter from "./routes/router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster />
      <RouterProvider router={AppRouter} />
    </AuthProvider>
  </React.StrictMode>
);
