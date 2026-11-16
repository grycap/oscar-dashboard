import AppSidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OscarStyles } from "@/styles";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function AppLayout() {
  const location = useLocation();

  if (location.pathname === "/ui") {
    return <Navigate to="/ui/services" replace />;
  }

  return (
      <SidebarProvider
        className="grid grid-cols-[auto_1fr] h-screen"
      >
        <AppSidebar />
        <main
          style={{
            flex: 1,
            display: "flex",
            marginTop: 10,
            borderTopLeftRadius: 8,
            background: "var(--surface-muted)",
            border: OscarStyles.border,
          }}
          className="overflow-y-auto"
        >
          <Outlet />
        </main>
      </SidebarProvider>
  );
}

export default AppLayout;
