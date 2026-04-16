import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }: { children: ReactNode }) {
  const { authData } = useAuth();

  if (authData.user !== "oscar") {
    return <Navigate to="/ui/services" />;
  }

  return children;
}

export default AdminRoute;