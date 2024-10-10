import { HashRouter,  Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import AppLayout from "@/pages/ui/layout";
import ServicesRouter from "@/pages/ui/services/router";
import Login from "@/pages/Login";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import { MinioProvider } from "@/contexts/Minio/MinioContext";
import MinioRouter from "@/pages/ui/minio/router";

function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/ui"
          element={
            <ProtectedRoute>
              <MinioProvider>
                <AppLayout />
              </MinioProvider>
            </ProtectedRoute>
          }
        >
          <Route path="services/*" element={<ServicesRouter />} />
          <Route path="minio/*" element={<MinioRouter />} />
          <Route path="info" element={<h1>Info</h1>} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/ui/services" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default AppRouter;
