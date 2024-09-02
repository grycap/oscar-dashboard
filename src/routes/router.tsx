import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import AppLayout from "@/pages/ui/layout";
import ServicesRouter from "@/pages/ui/services/router";
import Login from "@/pages/Login";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/ui"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="services/*" element={<ServicesRouter />} />
          <Route path="minio" element={<h1>Minio</h1>} />
          <Route path="info" element={<h1>Info</h1>} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/ui/services" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
